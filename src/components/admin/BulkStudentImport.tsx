import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Upload, Download, Loader2, CheckCircle, XCircle, FileSpreadsheet } from "lucide-react";

interface ImportResult {
  name: string;
  userId: string;
  success: boolean;
  error?: string;
}

interface BulkStudentImportProps {
  onComplete: () => void;
  gradeOptions: { value: string; label: string }[];
}

export const BulkStudentImport = ({ onComplete, gradeOptions }: BulkStudentImportProps) => {
  const [open, setOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [defaultClass, setDefaultClass] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const csvContent = "full_name,phone,class\nMohamed Ahmed Hassan,+201234567890,3prp\nSara Ali Omar,,1sec";
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "students_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const parseCSV = (text: string): Array<{ full_name: string; phone: string; class: string }> => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) return [];

    const headers = lines[0].toLowerCase().split(",").map(h => h.trim());
    const nameIdx = headers.findIndex(h => h.includes("name"));
    const phoneIdx = headers.findIndex(h => h.includes("phone"));
    const classIdx = headers.findIndex(h => h.includes("class") || h.includes("grade"));

    return lines.slice(1).map(line => {
      const values = line.split(",").map(v => v.trim().replace(/^["']|["']$/g, ''));
      return {
        full_name: nameIdx >= 0 ? values[nameIdx] || "" : "",
        phone: phoneIdx >= 0 ? values[phoneIdx] || "" : "",
        class: classIdx >= 0 ? values[classIdx] || defaultClass : defaultClass,
      };
    }).filter(row => row.full_name.trim().length > 0);
  };

  const validateFullName = (name: string): boolean => {
    const parts = name.trim().split(/\s+/);
    return parts.length >= 3 && parts.every(p => p.length > 0);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast.error("Please upload a CSV file");
      return;
    }

    setImporting(true);
    setResults([]);

    try {
      const text = await file.text();
      const students = parseCSV(text);

      if (students.length === 0) {
        toast.error("No valid students found in CSV");
        setImporting(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      const SUPABASE_URL = "https://lhdwmdebrqezcyjnrbnb.supabase.co";
      
      const importResults: ImportResult[] = [];

      for (const student of students) {
        if (!validateFullName(student.full_name)) {
          importResults.push({
            name: student.full_name,
            userId: "",
            success: false,
            error: "Name must have 3 parts",
          });
          continue;
        }

        if (!student.class) {
          importResults.push({
            name: student.full_name,
            userId: "",
            success: false,
            error: "Class is required",
          });
          continue;
        }

        try {
          const response = await fetch(`${SUPABASE_URL}/functions/v1/create-user`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${session?.access_token}`,
            },
            body: JSON.stringify({
              full_name: student.full_name,
              phone: student.phone,
              class: student.class,
            }),
          });

          const result = await response.json();
          
          if (result.error) {
            importResults.push({
              name: student.full_name,
              userId: "",
              success: false,
              error: result.error,
            });
          } else {
            importResults.push({
              name: student.full_name,
              userId: result.loginId,
              success: true,
            });
          }
        } catch (err: any) {
          importResults.push({
            name: student.full_name,
            userId: "",
            success: false,
            error: err.message || "Unknown error",
          });
        }
      }

      setResults(importResults);
      const successCount = importResults.filter(r => r.success).length;
      toast.success(`Imported ${successCount} of ${students.length} students`);
      onComplete();
    } catch (error: any) {
      toast.error("Failed to parse CSV file");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const exportResults = () => {
    const csvContent = "Name,User ID,Status,Error\n" + 
      results.map(r => 
        `"${r.name}","${r.userId}","${r.success ? 'Success' : 'Failed'}","${r.error || ''}"`
      ).join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "import_results.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-card border-primary/30 max-w-lg mx-2">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            Bulk Import Students
          </DialogTitle>
          <DialogDescription>
            Upload a CSV file to create multiple student accounts at once
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Button variant="outline" onClick={downloadTemplate} className="w-full">
            <Download className="w-4 h-4 mr-2" />
            Download CSV Template
          </Button>

          <div>
            <Label>Default Grade (for rows without class)</Label>
            <Select value={defaultClass} onValueChange={setDefaultClass}>
              <SelectTrigger>
                <SelectValue placeholder="Select default grade" />
              </SelectTrigger>
              <SelectContent>
                {gradeOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Upload CSV File</Label>
            <Input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={importing}
              className="cursor-pointer"
            />
          </div>

          {importing && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Importing students...
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label>Import Results</Label>
                <Button size="sm" variant="outline" onClick={exportResults}>
                  <Download className="w-3 h-3 mr-1" />
                  Export
                </Button>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {results.map((result, idx) => (
                  <Card key={idx} className={`p-2 ${result.success ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
                    <div className="flex items-center gap-2">
                      {result.success ? (
                        <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{result.name}</p>
                        {result.success ? (
                          <p className="text-xs text-muted-foreground">ID: {result.userId}</p>
                        ) : (
                          <p className="text-xs text-red-400">{result.error}</p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
