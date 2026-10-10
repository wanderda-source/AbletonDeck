using System;
using System.IO;
public static class InstallerTests {
    static void Check(bool value,string message){if(!value)throw new Exception(message);}
    [STAThread]
    public static int Main(string[] args){
        string area=Path.GetFullPath(args[0]);Directory.CreateDirectory(area);
        var roots=DeckSetup.Roots(Path.Combine(area,"Library"),Path.Combine(area,"AppData"));
        DeckSetup.Install(roots);
        Check(File.Exists(Path.Combine(roots["plugin"],"manifest.json")),"Missing plugin");
        Check(File.Exists(Path.Combine(roots["meter"],"AbletonDeck Meter.amxd")),"Missing meter");
        Check(File.Exists(Path.Combine(roots["remote"],"controller.py")),"Missing remote");
        string settings=Path.Combine(roots["plugin"],"meter-connection.json");File.WriteAllText(settings,"user settings");
        DeckSetup.Install(roots);Check(File.ReadAllText(settings)=="user settings","Update changed user settings");
        string modified=Path.Combine(roots["remote"],"controller.py");File.WriteAllText(modified,"user modification");
        Check(DeckSetup.Remove(roots)==1,"Modified file was not preserved");
        Check(File.ReadAllText(modified)=="user modification","Removal changed user file");
        Check(File.ReadAllText(settings)=="user settings","Removal changed private settings");
        Check(!File.Exists(Path.Combine(roots["plugin"],"manifest.json")),"Removal left packaged plugin file");
        var stranger=DeckSetup.Roots(Path.Combine(area,"OtherLibrary"),Path.Combine(area,"OtherAppData"));
        Directory.CreateDirectory(stranger["remote"]);string sentinel=Path.Combine(stranger["remote"],"keep.txt");File.WriteAllText(sentinel,"preserve");
        bool blocked=false;try{DeckSetup.Install(stranger);}catch{blocked=true;}
        Check(blocked&&File.ReadAllText(sentinel)=="preserve","Unowned directory was overwritten");
        Check(!Directory.Exists(stranger["plugin"]),"Preflight left a partial installation");
        var rollback=DeckSetup.Roots(Path.Combine(area,"RollbackLibrary"),Path.Combine(area,"RollbackAppData"));
        Directory.CreateDirectory(rollback["plugin"]);File.WriteAllText(Path.Combine(rollback["plugin"],".abletondeck-owned"),"old marker");
        Directory.CreateDirectory(Path.Combine(rollback["plugin"],"spectrogram.cjs"));
        bool failed=false;try{DeckSetup.Install(rollback);}catch{failed=true;}
        Check(failed,"Fault injection did not fail");Check(!File.Exists(Path.Combine(rollback["plugin"],"manifest.json")),"Rollback left partially installed files");
        Check(File.ReadAllText(Path.Combine(rollback["plugin"],".abletondeck-owned"))=="old marker","Rollback changed original marker");
        if(args.Length>1){using(var form=new SetupWindow())using(var bitmap=new System.Drawing.Bitmap(form.Width,form.Height)){form.ShowInTaskbar=false;form.Opacity=0;form.Show();System.Windows.Forms.Application.DoEvents();form.DrawToBitmap(bitmap,new System.Drawing.Rectangle(0,0,bitmap.Width,bitmap.Height));bitmap.Save(args[1],System.Drawing.Imaging.ImageFormat.Png);}}
        Console.WriteLine("PASS: payload, install, update, removal, modified-file preservation, ownership preflight, failure rollback");return 0;
    }
}
