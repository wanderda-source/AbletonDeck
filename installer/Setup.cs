using System;
using System.IO;
using System.IO.Compression;
using System.Collections.Generic;
using System.Drawing;
using System.Windows.Forms;
using System.Security.Cryptography;
using System.Diagnostics;

[assembly: System.Reflection.AssemblyTitle("AbletonDeck Setup")]
[assembly: System.Reflection.AssemblyProduct("AbletonDeck")]
[assembly: System.Reflection.AssemblyDescription("Free Stream Deck audio analysis for Ableton Live")]
[assembly: System.Reflection.AssemblyVersion("0.3.15.0")]
[assembly: System.Reflection.AssemblyFileVersion("0.3.15.0")]

public static class DeckSetup {
    public const string Version="0.3.15";
    public static Dictionary<string,byte[]> Payload() {
        var files=new Dictionary<string,byte[]>();
        using(var stream=typeof(DeckSetup).Assembly.GetManifestResourceStream("AbletonDeck.payload"))
        using(var zip=new ZipArchive(stream,ZipArchiveMode.Read)) {
            foreach(var entry in zip.Entries) {
                var key=entry.FullName;
                if(key.Contains("..")||key.Contains("\\")||key.StartsWith("/")||key.Contains(":")||!(key.StartsWith("plugin/")||key.StartsWith("meter/")||key.StartsWith("remote/")))throw new Exception("Invalid package path.");
                using(var input=entry.Open())using(var output=new MemoryStream()){input.CopyTo(output);files.Add(key,output.ToArray());}
            }
        }
        if(!files.ContainsKey("plugin/manifest.json")||!files.ContainsKey("meter/AbletonDeck Meter.amxd")||!files.ContainsKey("remote/controller.py"))throw new Exception("Incomplete installer package.");
        return files;
    }
    public static Dictionary<string,string> Roots(string library,string appData) {
        return new Dictionary<string,string>{{"plugin",Path.Combine(appData,"Elgato","StreamDeck","Plugins","com.personal.abletondeck.sdPlugin")},{"meter",Path.Combine(library,"Presets","Audio Effects","Max Audio Effect","AbletonDeck")},{"remote",Path.Combine(library,"Remote Scripts","AbletonDeck")}};
    }
    static string Target(string key,Dictionary<string,string> roots) {
        int slash=key.IndexOf('/');string root=Path.GetFullPath(roots[key.Substring(0,slash)]);
        string result=Path.GetFullPath(Path.Combine(root,key.Substring(slash+1).Replace('/',Path.DirectorySeparatorChar)));
        if(!result.StartsWith(root+Path.DirectorySeparatorChar,StringComparison.OrdinalIgnoreCase))throw new Exception("Invalid destination.");
        return result;
    }
    public static void Validate(Dictionary<string,string> roots) {
        foreach(var root in roots.Values) {
            if(Directory.Exists(root)&&!File.Exists(Path.Combine(root,".abletondeck-owned")))throw new Exception("Existing folder is not marked as an AbletonDeck installation. It was preserved:\n"+root+"\nChoose another User Library or back up and move that folder first.");
        }
    }
    public static void Install(Dictionary<string,string> roots) {
        var files=Payload();Validate(roots);
        var changes=new Dictionary<string,byte[]>();var created=new List<string>();
        try {
            foreach(var item in files) {
                string target=Target(item.Key,roots);changes.Add(target,File.Exists(target)?File.ReadAllBytes(target):null);
                string dir=Path.GetDirectoryName(target);var missing=new Stack<string>();
                while(!Directory.Exists(dir)){missing.Push(dir);dir=Path.GetDirectoryName(dir);}
                while(missing.Count>0){dir=missing.Pop();Directory.CreateDirectory(dir);created.Add(dir);}
                File.WriteAllBytes(target,item.Value);
            }
            foreach(var root in roots.Values){string mark=Path.Combine(root,".abletondeck-owned");changes.Add(mark,File.Exists(mark)?File.ReadAllBytes(mark):null);File.WriteAllText(mark,"AbletonDeck "+Version);}
        } catch {
            foreach(var item in changes){if(item.Value==null){if(File.Exists(item.Key))File.Delete(item.Key);}else File.WriteAllBytes(item.Key,item.Value);}
            created.Reverse();foreach(var dir in created)if(Directory.Exists(dir)&&Directory.GetFileSystemEntries(dir).Length==0)Directory.Delete(dir);
            throw;
        }
    }
    static bool Same(byte[] a,byte[] b){if(a.Length!=b.Length)return false;for(int j=0;j<a.Length;j++)if(a[j]!=b[j])return false;return true;}
    public static int Remove(Dictionary<string,string> roots) {
        Validate(roots);int preserved=0;var files=Payload();
        foreach(var item in files){string target=Target(item.Key,roots);if(!File.Exists(target))continue;if(Same(File.ReadAllBytes(target),item.Value))File.Delete(target);else preserved++;}
        var directories=new SortedSet<string>(Comparer<string>.Create((a,b)=>{int n=b.Length.CompareTo(a.Length);return n!=0?n:StringComparer.OrdinalIgnoreCase.Compare(a,b);}));
        foreach(var item in files){string dir=Path.GetDirectoryName(Target(item.Key,roots));string root=roots[item.Key.Substring(0,item.Key.IndexOf('/'))];while(dir.Length>root.Length){directories.Add(dir);dir=Path.GetDirectoryName(dir);}}
        foreach(var dir in directories)if(Directory.Exists(dir)&&Directory.GetFileSystemEntries(dir).Length==0)Directory.Delete(dir);
        // Keep ownership markers while any modified files or user settings remain.
        foreach(var root in roots.Values)if(Directory.Exists(root)&&Directory.GetFileSystemEntries(root).Length==1&&File.Exists(Path.Combine(root,".abletondeck-owned"))){File.Delete(Path.Combine(root,".abletondeck-owned"));Directory.Delete(root);}
        return preserved;
    }
    [STAThread]
    public static int Main(string[] args) {
        if(args.Length==1&&args[0]=="--verify") {try{Console.WriteLine("AbletonDeck "+Version+": "+Payload().Count+" files verified");return 0;}catch(Exception e){Console.Error.WriteLine(e.Message);return 1;}}
        Application.EnableVisualStyles();Application.SetCompatibleTextRenderingDefault(false);Application.Run(new SetupWindow());return 0;
    }
}
public class SetupWindow:Form {
    TextBox library;Button install,remove;Label status;
    public SetupWindow(){
        Text="AbletonDeck Setup · "+DeckSetup.Version;ClientSize=new Size(620,420);FormBorderStyle=FormBorderStyle.FixedDialog;MaximizeBox=false;StartPosition=FormStartPosition.CenterScreen;
        BackColor=Color.FromArgb(23,23,23);ForeColor=Color.White;Font=new Font("Segoe UI",10);
        var title=new Label{Text="AbletonDeck",Location=new Point(24,22),Size=new Size(540,40),Font=new Font("Segoe UI",24,FontStyle.Bold),ForeColor=Color.FromArgb(242,86,35)};Controls.Add(title);
        Controls.Add(new Label{Text="Free audio analysis for Stream Deck + Ableton Live Suite",Location=new Point(26,70),Size=new Size(570,26)});
        Controls.Add(new Label{Text="Ableton User Library",Location=new Point(26,120),Size=new Size(400,24)});
        library=new TextBox{Text=Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments),"Ableton","User Library"),Location=new Point(26,148),Size=new Size(470,28)};Controls.Add(library);
        var browse=new Button{Text="Browse…",Location=new Point(505,146),Size=new Size(90,30)};browse.Click+=(s,e)=>{using(var dialog=new FolderBrowserDialog()){dialog.Description="Select Ableton User Library (Live Settings > Library)";dialog.SelectedPath=library.Text;if(dialog.ShowDialog()==DialogResult.OK)library.Text=dialog.SelectedPath;}};Controls.Add(browse);
        Controls.Add(new Label{Text="1. Close Stream Deck before installing.\n2. Save your work; restart Ableton after installation.\n3. Place AbletonDeck Meter.amxd last on Main/Master.\n4. For Live controls: select AbletonDeck as Control Surface.",Location=new Point(26,196),Size=new Size(570,100)});
        install=new Button{Text="Install / Update",Location=new Point(26,312),Size=new Size(180,40),BackColor=Color.FromArgb(242,86,35),ForeColor=Color.Black,FlatStyle=FlatStyle.Flat};install.Click+=(s,e)=>Run(false);Controls.Add(install);
        remove=new Button{Text="Remove",Location=new Point(222,312),Size=new Size(120,40)};remove.Click+=(s,e)=>Run(true);Controls.Add(remove);
        status=new Label{Text="Windows · Stream Deck 6.6+ · Live 12 Suite · No administrator rights",Location=new Point(26,374),Size=new Size(570,32),ForeColor=Color.LightGray};Controls.Add(status);
    }
    void Run(bool uninstall){
        try {
            if(Process.GetProcessesByName("StreamDeck").Length>0)throw new Exception("Close Stream Deck from the system tray, then try again. Your profiles will stay unchanged.");
            string path=library.Text.Trim();if(!Path.IsPathRooted(path)||!Directory.Exists(path))throw new Exception("Select your existing Ableton User Library. Find its path in Live Settings > Library.");
            var roots=DeckSetup.Roots(path,Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData));
            if(uninstall&&MessageBox.Show("Remove AbletonDeck files from the selected User Library and Stream Deck? Modified files and profiles will be preserved.","AbletonDeck",MessageBoxButtons.YesNo,MessageBoxIcon.Question)!=DialogResult.Yes)return;
            install.Enabled=remove.Enabled=false;
            if(uninstall){int preserved=DeckSetup.Remove(roots);status.Text="Removed. Modified files preserved: "+preserved;}else{DeckSetup.Install(roots);status.Text="Installed. Open Stream Deck and restart Live when your work is saved.";MessageBox.Show("Installed successfully.\n\nOpen Stream Deck and find AbletonDeck actions.\nRestart Live after saving your project.\nAdd User Library > Presets > Audio Effects > Max Audio Effect > AbletonDeck > AbletonDeck Meter.amxd last on Main/Master.\n\nOptional Live controls: Settings > Link, Tempo & MIDI > Control Surface: AbletonDeck; Input/Output: None.\n\nUse one meter device per project.","AbletonDeck",MessageBoxButtons.OK,MessageBoxIcon.Information);}
        }catch(Exception e){MessageBox.Show(e.Message,"AbletonDeck",MessageBoxButtons.OK,MessageBoxIcon.Error);}
        finally{install.Enabled=remove.Enabled=true;}
    }
}
