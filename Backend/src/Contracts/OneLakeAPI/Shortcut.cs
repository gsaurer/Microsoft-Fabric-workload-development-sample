using System;

public class Shortcut
{
    public string name { get; set; }
    public string path { get; set; }
    public ShortcutTarget target { get; set; }
}

public class CreatableShortcutTarget
{
    public ShortcutOneLake oneLake { get; set; }

}

public class ShortcutCreateRequest
{
    public string name { get; set; }
    public string path { get; set; }
    public CreatableShortcutTarget target { get; set; }
}

public class ShortcutBase
{
}
public class ShortcutOneLake :ShortcutBase
{
    public Guid itemId { get; set; }
    public Guid workspaceId { get; set; }
    public string path { get; set; }
}	

public class ShortcutTarget : ShortcutCreateRequest
{
    public ShortcutTargetType type { get; set; }

}

public enum ShortcutTargetType {
    OneLake, 
    AmazonS3, 
    AdlsGen2, 
    GoogleCloudStorage, 
    S3Compatible, 
    Dataverse, 
    ExternalDataShare

}
