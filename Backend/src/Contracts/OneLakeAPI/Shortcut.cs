using System;

public class Shortcut
{
    public string Name { get; set; }
    public string Path { get; set; }
    public ShortcutTarget Target { get; set; }
}

public class CreatableShortcutTarget
{
    public ShortcutOneLake oneLake { get; set; }
    
    public ShortcutAmazonS3 amazonS3 { get; set; }

    public ShortcutAdlsGen2 adlsGen2 { get; set; }    

    public ShortcutGoogleCloudStorage googleCloudStorage { get; set; }  

    public ShortcutS3Compatible s3Compatible { get; set; }  

    public ShortcutDataverse dataverse { get; set; }  
}

public class ShortcutCreateRequest
{
    public string Name { get; set; }
    public string Path { get; set; }
    public CreatableShortcutTarget Target { get; set; }
}

public class ShortcutBase
{
}
public class ShortcutOneLake :ShortcutBase
{
    public Guid ItemId { get; set; }
    public Guid WorkspaceId { get; set; }
    public string Path { get; set; }
}	

public class ShortcutAmazonS3 : ShortcutBase
{
    public string Location { get; set; }
    public string Subpath { get; set; }
    public Guid ConnectionId { get; set; }
}

public class ShortcutAdlsGen2 : ShortcutBase
{
    public string Location { get; set; }
    public string Subpath { get; set; }
    public Guid ConnectionId { get; set; }
}

public class ShortcutGoogleCloudStorage : ShortcutBase
{
    public string Location { get; set; }
    public string Subpath { get; set; }
    public Guid ConnectionId { get; set; }
}

public class ShortcutS3Compatible : ShortcutBase
{
    public string Location { get; set; }
    public string Subpath { get; set; }
    public Guid ConnectionId { get; set; }
}

public class ShortcutDataverse : ShortcutBase
{
    public string Location { get; set; }
    public string Subpath { get; set; }
    public Guid ConnectionId { get; set; }
}

public class ShortcutTarget : ShortcutCreateRequest
{
    public ShortcutTargetType Type { get; set; }

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
