import React, { useState, useEffect, FormEvent } from "react";
import { useLocation, useParams } from "react-router-dom";
import { Stack } from "@fluentui/react";
import {
  Button,
  Combobox,
  Divider,
  Field,
  Input,
  Label,
  Option,
  Radio,
  RadioGroup,
  TabValue,
  Tooltip,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  MessageBarActions,
  RadioGroupOnChangeData
} from "@fluentui/react-components";
import { initializeIcons } from "@fluentui/font-icons-mdl2";
import {
  Database16Regular,
  TriangleRight20Regular,
} from "@fluentui/react-icons";
import { AfterNavigateAwayData } from "@ms-fabric/workload-client";
import { ContextProps, PageProps } from "src/App";
import {
  callNavigationBeforeNavigateAway,
  callNavigationAfterNavigateAway,
  callThemeOnChange,
  callDatahubOpen,
  callItemGet,
  callItemUpdate,
  callItemDelete,
  callGetItem1SupportedOperators,
  isOneLakeSupported,
  callOpenSettings,
  callRunItemJob
} from "../../controller/SampleWorkloadController";
import { Ribbon } from "../SampleWorkloadRibbon/SampleWorkloadRibbon";
import { convertGetItemResultToWorkloadItem } from "../../utils";
import {
  Item1ClientMetadata,
  GenericItem,
  ItemPayload,
  UpdateItemPayload,
  WorkloadItem,
} from "../../models/SampleWorkloadModel";
import "./../../styles.scss";
import { ItemMetadataNotFound } from "../../models/WorkloadExceptionsModel";
import { LoadingProgressBar } from "../LoadingIndicator/LoadingProgressBar";
import { LakehouseExplorerComponent } from '../SampleWorkloadLakehouseExplorer/SampleWorkloadLakehouseExplorer';
import { FileMetadata, TableMetadata } from "src/models/LakehouseExplorerModel";

export function SampleWorkloadEditor(props: PageProps) {
  const sampleWorkloadBEUrl = process.env.WORKLOAD_BE_URL;
  const { workloadClient } = props;
  const pageContext = useParams<ContextProps>();
  const { pathname } = useLocation();

  // initializing usage of FluentUI icons
  initializeIcons();

  // React state for WorkloadClient APIs
  const [operand1ValidationMessage, setOperand1ValidationMessage] = useState<string>("");
  const [operand2ValidationMessage, setOperand2ValidationMessage] = useState<string>("");
  const [selectedLakehouse, setSelectedLakehouse] = useState<GenericItem>(undefined);
  const [selectedLakehouseInExplorer, setSelectedLakehouseInExplorer] = useState<GenericItem>(undefined);
  const [selectedFileInExplorer, setSelectedFileInExplorer] = useState<FileMetadata>(undefined);
  const [selectedTableInExplorer, setSelectedTableInExplorer] = useState<TableMetadata>(undefined);
  const [sampleItem, setSampleItem] = useState<WorkloadItem<ItemPayload>>(undefined);
  
  const [isDirty, setDirty] = useState<boolean>(false);
  
  const [operand1, setOperand1] = useState<number>(0);
  const [operand2, setOperand2] = useState<number>(0);
  const [operator, setOperator] = useState<string | null>(null);
  const [invalidOperands, setInvalidOperands] = useState<boolean>(false);
  const [supportedOperators, setSupportedOperators] = useState<string[]>([]);
  const [hasLoadedSupportedOperators, setHasLoadedSupportedOperators] = useState(false);
  const [canUseOneLake, setCanUseOneLake] = useState<boolean>(false);
  const [storageName, setStorageName] = useState<string>("OneLake");
  const [storageType, setStorageType] = useState<string>("File");
  const [lastCalculationResult, setLastCalculationResult] = useState<number | null>(undefined);
  const [lastCalculationRunTime, setLastCalculationRunTime] = useState<Date | null>(undefined);
  const [lastCalculationRunId, setLastCalculationRunId] = useState<string | null>(undefined);
  const [lastCalculationResultLocation, setLastCalculationResultLocation] = useState<string | null>(undefined);

  const [isLoadingOperators, setIsLoadingOperators] = useState<boolean>(true);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const isLoading = isLoadingOperators || isLoadingData;
  const [itemEditorErrorMessage, setItemEditorErrorMessage] = useState<string>("");

  const INT32_MIN = -2147483648;
  const INT32_MAX = 2147483647;

  const [selectedTab, setSelectedTab] = useState<TabValue>("home");

  useEffect(() => {
    // Controller callbacks registrations:
    // register Blocking in Navigate.BeforeNavigateAway (for a forbidden url)
    callNavigationBeforeNavigateAway(workloadClient);

    // register a callback in Navigate.AfterNavigateAway
    callNavigationAfterNavigateAway(afterNavigateCallBack, workloadClient);

    // register Theme.onChange
    callThemeOnChange(workloadClient);
  }, []);

  // Effect to load supported operators once on component mount
  useEffect(() => {
    loadSupportedOperators();
  }, []);

  useEffect(() => {
    if (hasLoadedSupportedOperators) {
      loadDataFromUrl(pageContext, pathname);
    }
  }, [hasLoadedSupportedOperators, pageContext, pathname]);

  async function loadCanUseOneLake(workspaceId: string, itemId: string): Promise<void> {
    try {
      const oneLakeSupported = await isOneLakeSupported(sampleWorkloadBEUrl, workloadClient, workspaceId, itemId);
      setCanUseOneLake(oneLakeSupported);
    } catch (error) {
      console.error(`Error loading oneLakeSupported: ${error}`);
    }
  }

  async function loadSupportedOperators(): Promise<void> {
    setIsLoadingOperators(true);
    try {
      const operators = await callGetItem1SupportedOperators(sampleWorkloadBEUrl, workloadClient);
      setSupportedOperators(operators);
      setHasLoadedSupportedOperators(true);
    } catch (error) {
      console.error(`Error loading supported operators: ${error}`);
      setHasLoadedSupportedOperators(false);
    }
    finally {
      setIsLoadingOperators(false);
    }
  }

  async function afterNavigateCallBack(_event: AfterNavigateAwayData): Promise<void> {
    //clears the data after navigation
    setSelectedLakehouseInExplorer(undefined);
    setSelectedLakehouse(undefined);
    setSampleItem(undefined);
    return;
  }

  async function onCallDatahubLakehouse() {
    const result = await callDatahubOpen(
      ["Lakehouse"],
      "Select a Lakehouse to use for Sample Workload",
      false,
      workloadClient
    );
    if (result) {
      setSelectedLakehouse(result);
      setDirty(true);
    }
  }

  async function onNavigateToLakehouse() {
    if (selectedLakehouse) {
      var type = selectedLakehouse.type;
      //need to hardcode as the type is int and not the real string
      if (selectedLakehouse.type.toString() === "12")
        type = "lakehouses";

      const path = `/groups/${selectedLakehouse.workspaceId}/${type}/${selectedLakehouse.id}`;
      console.log(`Navigating to ${path}`);
      await workloadClient.navigation.navigate(`host`, {path});
    }
  }

  function isValidOperand(operand: number) {
    return operand > INT32_MIN && operand < INT32_MAX;
  }

  async function onOperand1InputChanged(value: number) {
    setOperand1(value);
    setDirty(true);
    if (!isValidOperand(value)) {
      setOperand1ValidationMessage("Operand 1 may lead to overflow");
      setInvalidOperands(true);
      return;
    }
    setOperand1ValidationMessage("");
    setInvalidOperands(!isValidOperand(operand2));
  }

  async function onOperand2InputChanged(value: number) {
    setOperand2(value);
    setDirty(true);
    if (!isValidOperand(value)) {
      setOperand2ValidationMessage("Operand 2 may lead to overflow");
      setInvalidOperands(true);
      return;
    }
    setOperand2ValidationMessage("");
    setInvalidOperands(!isValidOperand(operand1));
  }

  function onOperatorInputChanged(value: string | null) {
    setOperator(value);
    setDirty(true);
  }


  async function loadDataFromUrl(
    pageContext: ContextProps,
    pathname: string
  ): Promise<void> {
    setIsLoadingData(true);
    if (pageContext.itemObjectId) {
      // for Edit scenario we get the itemObjectId and then load the item via the workloadClient SDK
      try {        
        loadItemPayload()
        setSelectedTab("home");          
        setItemEditorErrorMessage("");
      } catch (error) {
        clearItemData();
        if (error?.ErrorCode === ItemMetadataNotFound) {
          setItemEditorErrorMessage(error?.Message);
          return;
        }
        console.error(
          `Error loading the Item (object ID:${pageContext.itemObjectId}`,
          error
        );
      }
      finally {
        setIsLoadingData(false);
      }
    } else {
      console.log(`non-editor context. Current Path: ${pathname}`);
      clearItemData();
      setIsLoadingData(false);
    }
  }

  function clearItemData() {
    setSampleItem(undefined);
  }

  async function saveItemPayload() {
    let payload: UpdateItemPayload = {
      item1Metadata: {
        lakehouse: selectedLakehouse,
        operand1: operand1,
        operand2: operand2,
        operator: operator,
        useOneLake: storageName === "OneLake",
        lastCalculationResult: lastCalculationResult,
        lastCalculationRunId: lastCalculationRunId,
        lastCalculationRunTime: lastCalculationRunTime,
        lastCalculationResultLocation: lastCalculationResultLocation,
      },
    };

    var successResult = await callItemUpdate(sampleItem.id, payload, workloadClient);
    setDirty(!successResult);
  }

  async function loadItemPayload() {
    const getItemResult = await callItemGet(pageContext.itemObjectId, workloadClient);
    const item = convertGetItemResultToWorkloadItem<ItemPayload>(getItemResult);
    console.log(`Loaded item: ${JSON.stringify(item)}`);    
    await setSampleItem(item);
    setSelectedLakehouseInExplorer(item)
    const item1Metadata: Item1ClientMetadata = item.extendedMetdata.item1Metadata;
    setSelectedLakehouse(item1Metadata.lakehouse);
    setStorageName(item1Metadata.useOneLake ? "OneLake" : "Lakehouse");            
    setOperand1(item1Metadata.operand1);
    setOperand1ValidationMessage("");
    setOperand2(item1Metadata.operand2);
    setOperand2ValidationMessage("");
    setOperator(item1Metadata.operator);
    setLastCalculationResult(item1Metadata.lastCalculationResult);                        
    setLastCalculationRunId(item1Metadata.lastCalculationRunId);                        
    setLastCalculationRunTime(item1Metadata.lastCalculationRunTime);             
    setLastCalculationResultLocation(item1Metadata.lastCalculationResultLocation);                   
    setInvalidOperands(false);    
    loadCanUseOneLake(item.workspaceId, item.id);
  }

  async function refreshItemEditor() {
    loadItemPayload()    
  }

  async function openSettings() {
    if (sampleItem) {
      const item = await callItemGet(sampleItem.id, workloadClient);
      await callOpenSettings(item, workloadClient, 'About');
    }
  }

  async function deleteItem(itemId: string) {
    await callItemDelete(itemId, workloadClient);
  }

  function getItemObjectId() {
    return sampleItem?.id || pageContext.itemObjectId;
  }

  const selectedStorageChanged = (ev: FormEvent<HTMLDivElement>, data: RadioGroupOnChangeData) => {
    setStorageName(data.value);
    setDirty(true);
  };

  const selectedStorageTypeChanged = (ev: FormEvent<HTMLDivElement>, data: RadioGroupOnChangeData) => {
    setStorageType(data.value);
    setDirty(true);
  };

  async function onRunCalculationButtonClick(){
    saveItemPayload();
    var jobType = "Org.WorkloadSample.SampleWorkloadItem.CalculateAsText";
    if(storageType === "CSV"){
      jobType = "Org.WorkloadSample.SampleWorkloadItem.CalculateAsCSV";
    }
    callRunItemJob(
      getItemObjectId(),
      jobType,
      JSON.stringify({metadata: 'JobMetadata'}),
      true /* showNotification */,
      workloadClient);
  };

  function getOneLakeTooltipText(regularTooltipMessage: string, canUseOneLake: boolean): string {
    return !canUseOneLake
      ? 'OneLake is not supported for this item type. CreateOneLakeFoldersOnArtifactCreation attribute must be set in the item manifest.'
      : regularTooltipMessage;
  }

  function deleteFileFromOneLake(){
    if(selectedFileInExplorer){
      setSelectedFileInExplorer(undefined);  
    } 
    if(selectedTableInExplorer){
      setSelectedTableInExplorer(undefined);
    }
  }

  // HTML page contents
  if (isLoading) {
    return <LoadingProgressBar message="Loading..." />;
  }
  return (
    <Stack className="editor" data-testid="sample-workload-editor-inner">
      <Ribbon
        {...props}
        isStorageSelected={selectedLakehouse != undefined || storageName === "OneLake"}
        //  disable save when in Frontend-only
        isSaveButtonEnabled={
          sampleItem?.id !== undefined &&
          (selectedLakehouse != undefined || storageName === "OneLake") &&
          isDirty &&
          !invalidOperands &&
          !!operator
        }
        saveItemCallback={saveItemPayload}
        isDeleteOneLakeFileButtonEnabled={selectedFileInExplorer != undefined || selectedTableInExplorer != undefined}
        deleteOneLakeFileCallback={() => deleteFileFromOneLake()}
        refreshItemCallback={() => refreshItemEditor()}
        isFEOnly={sampleItem?.id !== undefined}
        openSettingsCallback={openSettings}
        itemObjectId={getItemObjectId()}
        selectedTab={selectedTab}
        onTabChange={setSelectedTab}
        isDirty={isDirty}
        invalidOperands={invalidOperands}
      />

      <Stack className="main">
        {["jobs", "home"].includes(selectedTab as string) && (
            <Stack horizontal tokens={{ childrenGap: 20 }}>
              <Stack.Item>
                <LakehouseExplorerComponent workloadClient={workloadClient} selectedLakehouse={selectedLakehouseInExplorer} setSelectedLakehouse={setSelectedLakehouseInExplorer}/>
              </Stack.Item>
              <Stack.Item>
                <span>
                  <h2>Sample Item Editor</h2>
                  {/* Crud item API usage example */}
                  {itemEditorErrorMessage && (
                    <MessageBar intent="error">
                      <MessageBarBody className="message-bar-body">
                      <MessageBarTitle>
                        You cannot edit this item.
                      </MessageBarTitle>
                      {itemEditorErrorMessage}
                      <MessageBarActions>
                        <Button onClick={() => deleteItem(pageContext.itemObjectId)}>
                        Delete Item
                        </Button>
                      </MessageBarActions>
                      </MessageBarBody>
                    </MessageBar>
                  )}
                </span>
                {!itemEditorErrorMessage && (
                <Stack horizontal tokens={{ childrenGap: 20 }}>
                  <Stack.Item>
                    <span>                 
                        <div>
                          <Divider alignContent="start">
                            {sampleItem ? "" : "New "}Item Details
                          </Divider>
                          <div className="section" data-testid='item-editor-metadata' >
                            {sampleItem && (
                              <Label>WorkspaceId Id: {sampleItem?.workspaceId}</Label>
                            )}
                            {sampleItem && <Label>Item Id: {sampleItem?.id}</Label>}
                            {sampleItem && (
                              <Label>Item Display Name: {sampleItem?.displayName}</Label>
                            )}
                            {sampleItem && (
                              <Label>Item Description: {sampleItem?.description}</Label>
                            )}
                            {sampleItem && (
                              <Label>OneLake item location: https://onelake.blob.fabric.microsoft.com/{sampleItem?.workspaceId}/{sampleItem?.id}/</Label>
                            )}
                          </div>
                        </div>
                    </span>
                  </Stack.Item>
                  <Stack.Item>
                    <span>
                        <div>
                          <Divider alignContent="start">Calculation job storage settings</Divider>
                          <div className="section">
                            <Label>Store location:</Label>
                            <RadioGroup onChange={selectedStorageChanged} value={storageName}>
                              <Tooltip
                                content={getOneLakeTooltipText("Item folder in OneLake", canUseOneLake)}
                                relationship="label">
                                <Radio 
                                  value="OneLake" 
                                  label="Item folder in OneLake" 
                                  disabled={!canUseOneLake} 
                                data-testid="onelake-radiobutton-tooltip" />
                              </Tooltip>
                              <Radio value="Lakehouse" label="Lakehouse" />
                              {storageName === "Lakehouse" && (
                              <div style={{ marginLeft: "32px", padding: "4px" }}>
                                <Stack>
                                  <Field
                                  label="Name"
                                  orientation="horizontal"
                                  className="field"
                                  >
                                  <Stack horizontal>
                                    <Input
                                      size="small"
                                      placeholder="Lakehouse Name"
                                      style={{ marginLeft: "10px" }}
                                      value={
                                      selectedLakehouse ? selectedLakehouse.displayName : ""
                                      }
                                    />
                                    <Button
                                      style={{ width: "24px", height: "24px" }}
                                      icon={<Database16Regular />}
                                      appearance="primary"
                                      onClick={() => onCallDatahubLakehouse()}
                                      data-testid="item-editor-lakehouse-btn"
                                    />                        
                                  </Stack>
                                  </Field>
                                  <Field
                                  label="ID"
                                  orientation="horizontal"
                                  className="field"
                                  >
                                    <Input
                                    size="small"
                                    placeholder="Lakehouse ID"
                                    style={{ marginLeft: "10px" }}
                                    value={selectedLakehouse ? selectedLakehouse.id : ""}
                                    data-testid="lakehouse-id-input"
                                    />
                                  </Field>
                                </Stack>
                                <Button
                                  appearance="primary"
                                  icon={<TriangleRight20Regular />}
                                  disabled={selectedLakehouse ? false : true}
                                  onClick={() => onNavigateToLakehouse()}
                                  >Navigate to Lakehouse</Button>
                              </div>)}
                            </RadioGroup>
                            <Label>Store format:</Label>
                            <RadioGroup onChange={selectedStorageTypeChanged} value={storageType}>
                              <Stack horizontal tokens={{ childrenGap: 10 }}>
                                <Radio 
                                  value="File" 
                                  label="Single File" />
                                <Tooltip
                                  content="Store the information in a single file" 
                                  relationship="label"/>
                                <Radio 
                                  value="CSV" 
                                  label="CSV File" />
                                <Tooltip
                                  content="Store the information in a CSV file" 
                                  relationship="label"/>
                              </Stack>
                            </RadioGroup>                   
                          </div>
                          <Divider alignContent="start">Calculation definition</Divider>
                          <div className="section">
                            <Field
                            label="Operand 1"
                            validationMessage={operand1ValidationMessage}
                            orientation="horizontal"
                            className="field"
                            >
                            <Input
                              size="small"
                              type="number"
                              placeholder="Value of the 1st operand"
                              value={operand1.toString()}
                              onChange={(e) =>
                              onOperand1InputChanged(parseInt(e.target.value))
                              }
                              data-testid="operand1-input"
                            />
                            </Field>
                            <Field
                            label="Operand 2"
                            validationMessage={operand2ValidationMessage}
                            orientation="horizontal"
                            className="field"
                            >
                            <Input
                              size="small"
                              type="number"
                              placeholder="value of the 2nd operand"
                              value={operand2.toString()}
                              onChange={(e) =>
                              onOperand2InputChanged(parseInt(e.target.value))
                              }
                              data-testid="operand2-input"
                            />
                            </Field>
                            <Field
                            label="Operator"
                            orientation="horizontal"
                            className="field"
                            >
                            <Combobox
                              key={pageContext.itemObjectId}
                              data-testid="operator-combobox"
                              placeholder="Operator"
                              value={operator ?? ''}
                              onOptionSelect={(_, opt) =>
                              onOperatorInputChanged(opt.optionValue)
                              }
                            >
                              {supportedOperators.map((option) => (
                              <Option key={option} data-testid={option} value={option}>{option}</Option>
                              ))}
                            </Combobox>
                            </Field>
                            <Button
                            appearance="primary"
                            icon={<TriangleRight20Regular />}
                            disabled={false}
                            onClick={() => onRunCalculationButtonClick()}
                            >
                            Start calculation job
                            </Button>
                            <Divider alignContent="start">Last calculation run</Divider>
                            <Field
                            label="Run result"
                            orientation="horizontal"
                            className="field"
                            >
                              <Input
                                size="small"
                                type="number"
                                placeholder="Last calculation result"
                                data-testid="lastresult-input"
                                readOnly={true}
                                value={lastCalculationResult?.toString() ?? ""}
                              />
                            </Field>     
                            <Field
                            label="Run Time"
                            orientation="horizontal"
                            className="field"
                            >
                              <Input
                                size="small"
                                placeholder="Last calculation location"
                                data-testid="lastresult-input"
                                readOnly={true}                      
                                value={lastCalculationRunTime?.toString() ?? ""} 
                              />
                            </Field> 
                            <Field
                            label="Run Result location"
                            orientation="horizontal"
                            className="field"
                            >
                              <Input
                                size="small"
                                placeholder="Last calculation run result location"
                                data-testid="lastresult-input"
                                readOnly={true}
                                value={lastCalculationResultLocation ?? ""} 
                              />
                            </Field>              
                          </div>
                        </div>
                    </span>
                  </Stack.Item>
                </Stack>
                )}
              </Stack.Item>
            </Stack>
          )}
      </Stack>
    </Stack>
  );
}

