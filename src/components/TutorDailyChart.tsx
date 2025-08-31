import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DailyLeaveChart } from '@/components/DailyLeaveChart';
import { useAppContext } from '@/context/AppContext';
import { useBatchContext } from '@/context/BatchContext';
import { eachDayOfInterval, format, parseISO } from 'date-fns';
import { Download, Calendar } from 'lucide-react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

interface TutorDailyChartProps {
  title?: string;
  showDownloadButtons?: boolean;
  showDatePickers?: boolean;
  showBatchSemesterSelectors?: boolean;
}

const TutorDailyChart = ({ 
  title = "Daily Leave & OD Report", 
  showDownloadButtons = true,
  showDatePickers = true,
  showBatchSemesterSelectors = true
}: TutorDailyChartProps) => {
  const { students, leaveRequests, odRequests, currentTutor } = useAppContext();
  const { getSemesterDateRange } = useBatchContext();
  
  const [selectedBatch, setSelectedBatch] = useState<string>('all');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [errors, setErrors] = useState<string[]>([]);

  // Debug logging function - EXACT ADMIN LOGIC
  const addDebugInfo = (key: string, value: any) => {
    setDebugInfo(prev => ({ ...prev, [key]: value }));
    console.log([TutorDailyChart Debug] :, value);
  };
  
  const addError = (error: string) => {
    setErrors(prev => [...prev, error]);
    console.error([TutorDailyChart Error] Exception setting "WindowTitle": "Window title cannot be longer than 1023 characters." The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. Exception setting "WindowTitle": "Window title cannot be longer than 1023 characters." The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. System.Management.Automation.ParseException: At line:1 char:123
+ ...  | ForEach-Object { if ((Get-Content $_.FullName -Raw) -match \"tutor ...
+                                                                  ~
You must provide a value expression following the '-match' operator.

At line:1 char:124
+ ... Object { if ((Get-Content $_.FullName -Raw) -match \"tutory\") { Writ ...
+                                                        ~~~~~~~~~~
Unexpected token '\"tutory\"' in expression or statement.

At line:1 char:124
+ ... Object { if ((Get-Content $_.FullName -Raw) -match \"tutory\") { Writ ...
+                                                        ~~~~~~~~~~
Missing closing ')' after expression in 'if' statement.

At line:1 char:80
+ ... rse -Include "*.tsx","*.ts","*.js","*.jsx" | ForEach-Object { if ((Ge ...
+                                                                 ~
Missing closing '}' in statement block or type definition.

At line:1 char:134
+ ... bject { if ((Get-Content $_.FullName -Raw) -match \"tutory\") { Write ...
+                                                                 ~
Unexpected token ')' in expression or statement.

At line:1 char:239
+ ... Content $_.FullName | Select-String \"tutory\" -Context 1 } } | Selec ...
+                                                                 ~
Unexpected token '}' in expression or statement.

At line:1 char:241
+ ... ntent $_.FullName | Select-String \"tutory\" -Context 1 } } | Select- ...
+                                                                 ~
An empty pipe element is not allowed.
   at System.Management.Automation.Runspaces.PipelineBase.Invoke(IEnumerable input)
   at Microsoft.PowerShell.Executor.ExecuteCommandHelper(Pipeline tempPipeline, Exception& exceptionThrown, ExecutionOptions options) The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. A parameter cannot be found that matches parameter name 'PredictionSource'.);
  };

  // Clear custom dates when changing batch/semester - EXACT ADMIN LOGIC
  const handleBatchChange = (batch: string) => {
    setSelectedBatch(batch);
    setStartDate('');
    setEndDate('');
  };
  
  const handleSemesterChange = (semester: string) => {
    setSelectedSemester(semester);
    setStartDate('');
    setEndDate('');
  };

  // Add effect to log initial data - EXACT ADMIN LOGIC
  useEffect(() => {
    try {
      addDebugInfo('currentTutor', currentTutor);
      addDebugInfo('students', students);
      addDebugInfo('leaveRequests', leaveRequests);
      addDebugInfo('odRequests', odRequests);
    } catch (error) {
      addError(Error logging initial data: Exception setting "WindowTitle": "Window title cannot be longer than 1023 characters." The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. Exception setting "WindowTitle": "Window title cannot be longer than 1023 characters." The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. System.Management.Automation.ParseException: At line:1 char:123
+ ...  | ForEach-Object { if ((Get-Content $_.FullName -Raw) -match \"tutor ...
+                                                                  ~
You must provide a value expression following the '-match' operator.

At line:1 char:124
+ ... Object { if ((Get-Content $_.FullName -Raw) -match \"tutory\") { Writ ...
+                                                        ~~~~~~~~~~
Unexpected token '\"tutory\"' in expression or statement.

At line:1 char:124
+ ... Object { if ((Get-Content $_.FullName -Raw) -match \"tutory\") { Writ ...
+                                                        ~~~~~~~~~~
Missing closing ')' after expression in 'if' statement.

At line:1 char:80
+ ... rse -Include "*.tsx","*.ts","*.js","*.jsx" | ForEach-Object { if ((Ge ...
+                                                                 ~
Missing closing '}' in statement block or type definition.

At line:1 char:134
+ ... bject { if ((Get-Content $_.FullName -Raw) -match \"tutory\") { Write ...
+                                                                 ~
Unexpected token ')' in expression or statement.

At line:1 char:239
+ ... Content $_.FullName | Select-String \"tutory\" -Context 1 } } | Selec ...
+                                                                 ~
Unexpected token '}' in expression or statement.

At line:1 char:241
+ ... ntent $_.FullName | Select-String \"tutory\" -Context 1 } } | Select- ...
+                                                                 ~
An empty pipe element is not allowed.
   at System.Management.Automation.Runspaces.PipelineBase.Invoke(IEnumerable input)
   at Microsoft.PowerShell.Executor.ExecuteCommandHelper(Pipeline tempPipeline, Exception& exceptionThrown, ExecutionOptions options) The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. A parameter cannot be found that matches parameter name 'PredictionSource'.);
    }
  }, [students, leaveRequests, odRequests, currentTutor]);

  // Get tutor's student data
  const tutorStudentData = useMemo(() => {
    try {
      if (!currentTutor) return [];
      let filteredStudents = students.filter(s => s.tutor_id === currentTutor.id);
      
      // Filter by batch if selected
      if (selectedBatch !== 'all') {
        filteredStudents = filteredStudents.filter(s => s.batch === selectedBatch);
      }
      
      addDebugInfo('tutorStudentData', {
        tutorId: currentTutor.id,
        totalTutorStudents: students.filter(s => s.tutor_id === currentTutor.id).length,
        filteredCount: filteredStudents.length,
        selectedBatch
      });
      
      return filteredStudents;
    } catch (error) {
      addError(Error processing tutor student data: Exception setting "WindowTitle": "Window title cannot be longer than 1023 characters." The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. Exception setting "WindowTitle": "Window title cannot be longer than 1023 characters." The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. System.Management.Automation.ParseException: At line:1 char:123
+ ...  | ForEach-Object { if ((Get-Content $_.FullName -Raw) -match \"tutor ...
+                                                                  ~
You must provide a value expression following the '-match' operator.

At line:1 char:124
+ ... Object { if ((Get-Content $_.FullName -Raw) -match \"tutory\") { Writ ...
+                                                        ~~~~~~~~~~
Unexpected token '\"tutory\"' in expression or statement.

At line:1 char:124
+ ... Object { if ((Get-Content $_.FullName -Raw) -match \"tutory\") { Writ ...
+                                                        ~~~~~~~~~~
Missing closing ')' after expression in 'if' statement.

At line:1 char:80
+ ... rse -Include "*.tsx","*.ts","*.js","*.jsx" | ForEach-Object { if ((Ge ...
+                                                                 ~
Missing closing '}' in statement block or type definition.

At line:1 char:134
+ ... bject { if ((Get-Content $_.FullName -Raw) -match \"tutory\") { Write ...
+                                                                 ~
Unexpected token ')' in expression or statement.

At line:1 char:239
+ ... Content $_.FullName | Select-String \"tutory\" -Context 1 } } | Selec ...
+                                                                 ~
Unexpected token '}' in expression or statement.

At line:1 char:241
+ ... ntent $_.FullName | Select-String \"tutory\" -Context 1 } } | Select- ...
+                                                                 ~
An empty pipe element is not allowed.
   at System.Management.Automation.Runspaces.PipelineBase.Invoke(IEnumerable input)
   at Microsoft.PowerShell.Executor.ExecuteCommandHelper(Pipeline tempPipeline, Exception& exceptionThrown, ExecutionOptions options) The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. A parameter cannot be found that matches parameter name 'PredictionSource'.);
      return [];
    }
  }, [students, currentTutor, selectedBatch]);

  // Get available batches for this tutor's students - EXACT ADMIN LOGIC
  const availableBatches = useMemo(() => {
    try {
      if (!currentTutor) return ['all'];
      const allTutorStudents = students.filter(s => s.tutor_id === currentTutor.id);
      const batches = [...new Set(allTutorStudents.map(s => s.batch))]
        .map(b => parseInt(b))
        .sort((a, b) => b - a); // Sort descending like admin
      const result = ['all', ...batches];
      addDebugInfo('processedBatches', result);
      return result;
    } catch (error) {
      addError(Error processing batches: Exception setting "WindowTitle": "Window title cannot be longer than 1023 characters." The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. Exception setting "WindowTitle": "Window title cannot be longer than 1023 characters." The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. System.Management.Automation.ParseException: At line:1 char:123
+ ...  | ForEach-Object { if ((Get-Content $_.FullName -Raw) -match \"tutor ...
+                                                                  ~
You must provide a value expression following the '-match' operator.

At line:1 char:124
+ ... Object { if ((Get-Content $_.FullName -Raw) -match \"tutory\") { Writ ...
+                                                        ~~~~~~~~~~
Unexpected token '\"tutory\"' in expression or statement.

At line:1 char:124
+ ... Object { if ((Get-Content $_.FullName -Raw) -match \"tutory\") { Writ ...
+                                                        ~~~~~~~~~~
Missing closing ')' after expression in 'if' statement.

At line:1 char:80
+ ... rse -Include "*.tsx","*.ts","*.js","*.jsx" | ForEach-Object { if ((Ge ...
+                                                                 ~
Missing closing '}' in statement block or type definition.

At line:1 char:134
+ ... bject { if ((Get-Content $_.FullName -Raw) -match \"tutory\") { Write ...
+                                                                 ~
Unexpected token ')' in expression or statement.

At line:1 char:239
+ ... Content $_.FullName | Select-String \"tutory\" -Context 1 } } | Selec ...
+                                                                 ~
Unexpected token '}' in expression or statement.

At line:1 char:241
+ ... ntent $_.FullName | Select-String \"tutory\" -Context 1 } } | Select- ...
+                                                                 ~
An empty pipe element is not allowed.
   at System.Management.Automation.Runspaces.PipelineBase.Invoke(IEnumerable input)
   at Microsoft.PowerShell.Executor.ExecuteCommandHelper(Pipeline tempPipeline, Exception& exceptionThrown, ExecutionOptions options) The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. A parameter cannot be found that matches parameter name 'PredictionSource'.);
      return ['all'];
    }
  }, [students, currentTutor]);

  // Get available semesters for the selected batch - EXACT ADMIN LOGIC
  const availableSemesters = useMemo(() => {
    if (selectedBatch === 'all') return ['all'];
    // Show all 8 semesters for any selected batch - EXACT ADMIN LOGIC
    const availableSemesters = [1, 2, 3, 4, 5, 6, 7, 8];
    return ['all', ...availableSemesters];
  }, [selectedBatch]);

  // Pre-calculate semester date ranges - EXACT ADMIN LOGIC
  const semesterDateRanges = useMemo(() => {
    try {
      if (selectedBatch === 'all') return {};
      const semestersToUse = availableSemesters.filter(s => s !== 'all') as number[];
      const ranges: { [key: number]: { start: Date; end: Date } | null } = {};
      semestersToUse.forEach(semester => {
        const range = getSemesterDateRange(selectedBatch, semester);
        ranges[semester] = range;
        addDebugInfo(semesterRange__, range);
      });
      addDebugInfo('allSemesterDateRanges', ranges);
      return ranges;
    } catch (error) {
      addError(Error calculating semester date ranges: Exception setting "WindowTitle": "Window title cannot be longer than 1023 characters." The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. Exception setting "WindowTitle": "Window title cannot be longer than 1023 characters." The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. System.Management.Automation.ParseException: At line:1 char:123
+ ...  | ForEach-Object { if ((Get-Content $_.FullName -Raw) -match \"tutor ...
+                                                                  ~
You must provide a value expression following the '-match' operator.

At line:1 char:124
+ ... Object { if ((Get-Content $_.FullName -Raw) -match \"tutory\") { Writ ...
+                                                        ~~~~~~~~~~
Unexpected token '\"tutory\"' in expression or statement.

At line:1 char:124
+ ... Object { if ((Get-Content $_.FullName -Raw) -match \"tutory\") { Writ ...
+                                                        ~~~~~~~~~~
Missing closing ')' after expression in 'if' statement.

At line:1 char:80
+ ... rse -Include "*.tsx","*.ts","*.js","*.jsx" | ForEach-Object { if ((Ge ...
+                                                                 ~
Missing closing '}' in statement block or type definition.

At line:1 char:134
+ ... bject { if ((Get-Content $_.FullName -Raw) -match \"tutory\") { Write ...
+                                                                 ~
Unexpected token ')' in expression or statement.

At line:1 char:239
+ ... Content $_.FullName | Select-String \"tutory\" -Context 1 } } | Selec ...
+                                                                 ~
Unexpected token '}' in expression or statement.

At line:1 char:241
+ ... ntent $_.FullName | Select-String \"tutory\" -Context 1 } } | Select- ...
+                                                                 ~
An empty pipe element is not allowed.
   at System.Management.Automation.Runspaces.PipelineBase.Invoke(IEnumerable input)
   at Microsoft.PowerShell.Executor.ExecuteCommandHelper(Pipeline tempPipeline, Exception& exceptionThrown, ExecutionOptions options) The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. A parameter cannot be found that matches parameter name 'PredictionSource'.);
      return {};
    }
  }, [selectedBatch, availableSemesters, getSemesterDateRange]);

  // Get date constraints based on selected batch and semester - EXACT ADMIN LOGIC
  const getDateConstraints = () => {
    if (selectedBatch === 'all' || selectedSemester === 'all') {
      return { minDate: '', maxDate: '', prevSemesterEndDate: null };
    }
    
    const semester = parseInt(selectedSemester);
    const range = getSemesterDateRange(selectedBatch, semester);
    
    if (!range?.start) {
      return { minDate: '', maxDate: '', prevSemesterEndDate: null };
    }
    
    const today = new Date();
    const startDate = new Date(range.start);
    startDate.setHours(0, 0, 0, 0);

    // Update maxDate to today if it's beyond current date - EXACT ADMIN LOGIC
    const calculatedMaxDate = today < new Date(range.end) ? today : new Date(range.end);
    return {
      minDate: startDate.toISOString().split('T')[0],
      maxDate: calculatedMaxDate.toISOString().split('T')[0],
      prevSemesterEndDate: semester > 1 ? (getSemesterDateRange(selectedBatch, semester - 1)?.end || null) : null,
    };
  };

  const { minDate, maxDate, prevSemesterEndDate } = getDateConstraints();

  // Daily chart data calculation - EXACT ADMIN LOGIC but filtered for tutor's students
  const dailyChartData = useMemo(() => {
    try {
      addDebugInfo('chartDataCalculation_start', {
        selectedBatch,
        selectedSemester,
        startDate,
        endDate,
        tutorId: currentTutor?.id
      });
      
      // Check if we have valid filters - EXACT ADMIN LOGIC
      if (selectedBatch === 'all') {
        addDebugInfo('chartData_result', 'No batch selected');
        return [];
      }
      
      let interval: { start: Date; end: Date } | null = null;
      
      if (startDate && endDate) {
        // Use custom date range if both dates are provided - EXACT ADMIN LOGIC
        const customStart = new Date(startDate);
        const customEnd = new Date(endDate);
        customEnd.setHours(23, 59, 59, 999); // End of day
        
        if (customStart <= customEnd) {
          interval = { start: customStart, end: customEnd };
          addDebugInfo('interval_custom', interval);
        }
      } else if (selectedSemester !== 'all') {
        // Use semester date range as fallback - EXACT ADMIN LOGIC
        const semester = parseInt(selectedSemester);
        const range = semesterDateRanges[semester];
        
        addDebugInfo(ange_for_semester_, range);
        
        if (range?.start && range.start instanceof Date) {
          const today = new Date();
          today.setHours(23, 59, 59, 999);
          
          const endDate = (range.end && range.end instanceof Date && today > range.end) ? range.end : today;
          interval = { start: new Date(range.start), end: endDate };
          addDebugInfo('interval_semester', interval);
        } else {
          addDebugInfo('no_valid_range_found', {
            semester,
            range,
            hasStart: range?.start,
            isDate: range?.start instanceof Date
          });
        }
      }
      
      if (!interval || interval.start > interval.end) {
        addDebugInfo('no_valid_interval', { interval });
        return [];
      }

      // Get students in the selected batch - FILTER FOR TUTOR'S STUDENTS ONLY
      const studentsInBatch = tutorStudentData.filter(s => s.batch === selectedBatch);
      const batchStudentIds = new Set(studentsInBatch.map(s => s.id));
      
      addDebugInfo('students_in_batch', {
        batch: selectedBatch,
        count: studentsInBatch.length,
        tutorStudents: studentsInBatch
      });

      const days = eachDayOfInterval(interval);
      addDebugInfo('days_in_interval', { count: days.length, first: days[0], last: days[days.length - 1] });

      const chartData = days.map(day => {
        const studentsOnLeave = new Set<string>();
        const studentsOnOD = new Set<string>();
        
        // Process leave requests - EXACT ADMIN LOGIC but filter by tutor's students
        leaveRequests.forEach(req => {
          if (req.status === 'Approved' && batchStudentIds.has(req.student_id)) {
            const leaveStart = parseISO(req.start_date);
            const leaveEnd = parseISO(req.end_date);
            
            const dayStart = new Date(day);
            dayStart.setHours(0, 0, 0, 0);
            
            const leaveStartNormalized = new Date(leaveStart);
            leaveStartNormalized.setHours(0, 0, 0, 0);
            
            const leaveEndNormalized = new Date(leaveEnd);
            leaveEndNormalized.setHours(23, 59, 59, 999);
            
            if (dayStart >= leaveStartNormalized && dayStart <= leaveEndNormalized) {
              studentsOnLeave.add(req.student_id);
            }
          }
        });
        
        // Process OD requests - EXACT ADMIN LOGIC but filter by tutor's students
        odRequests.forEach(req => {
          if (req.status === 'Approved' && batchStudentIds.has(req.student_id)) {
            const odStart = parseISO(req.start_date);
            const odEnd = parseISO(req.end_date);
            
            const dayStart = new Date(day);
            dayStart.setHours(0, 0, 0, 0);
            
            const odStartNormalized = new Date(odStart);
            odStartNormalized.setHours(0, 0, 0, 0);
            
            const odEndNormalized = new Date(odEnd);
            odEndNormalized.setHours(23, 59, 59, 999);
            
            if (dayStart >= odStartNormalized && dayStart <= odEndNormalized) {
              studentsOnOD.add(req.student_id);
            }
          }
        });
        
        return { 
          date: format(day, 'MMM d'), 
          studentsOnLeave: studentsOnLeave.size,
          studentsOnOD: studentsOnOD.size
        };
      });
      
      addDebugInfo('final_chart_data', { count: chartData.length, sample: chartData.slice(0, 5) });
      return chartData;
    } catch (error) {
      addError(Error calculating daily chart data: Exception setting "WindowTitle": "Window title cannot be longer than 1023 characters." The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. Exception setting "WindowTitle": "Window title cannot be longer than 1023 characters." The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. System.Management.Automation.ParseException: At line:1 char:123
+ ...  | ForEach-Object { if ((Get-Content $_.FullName -Raw) -match \"tutor ...
+                                                                  ~
You must provide a value expression following the '-match' operator.

At line:1 char:124
+ ... Object { if ((Get-Content $_.FullName -Raw) -match \"tutory\") { Writ ...
+                                                        ~~~~~~~~~~
Unexpected token '\"tutory\"' in expression or statement.

At line:1 char:124
+ ... Object { if ((Get-Content $_.FullName -Raw) -match \"tutory\") { Writ ...
+                                                        ~~~~~~~~~~
Missing closing ')' after expression in 'if' statement.

At line:1 char:80
+ ... rse -Include "*.tsx","*.ts","*.js","*.jsx" | ForEach-Object { if ((Ge ...
+                                                                 ~
Missing closing '}' in statement block or type definition.

At line:1 char:134
+ ... bject { if ((Get-Content $_.FullName -Raw) -match \"tutory\") { Write ...
+                                                                 ~
Unexpected token ')' in expression or statement.

At line:1 char:239
+ ... Content $_.FullName | Select-String \"tutory\" -Context 1 } } | Selec ...
+                                                                 ~
Unexpected token '}' in expression or statement.

At line:1 char:241
+ ... ntent $_.FullName | Select-String \"tutory\" -Context 1 } } | Select- ...
+                                                                 ~
An empty pipe element is not allowed.
   at System.Management.Automation.Runspaces.PipelineBase.Invoke(IEnumerable input)
   at Microsoft.PowerShell.Executor.ExecuteCommandHelper(Pipeline tempPipeline, Exception& exceptionThrown, ExecutionOptions options) The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. The term 'git' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. A parameter cannot be found that matches parameter name 'PredictionSource'. A parameter cannot be found that matches parameter name 'PredictionSource'.);
      console.error('Error calculating daily chart data:', error);
      return [];
    }
  }, [selectedBatch, selectedSemester, startDate, endDate, semesterDateRanges, leaveRequests, odRequests, tutorStudentData]);

  // Enhanced download functionality - EXACT ADMIN LOGIC
  const downloadReport = (exportFormat: 'xlsx' | 'csv') => {
    let dataToDownload = [];
    let reportTitle = '';
    let reportType = 'daily';

    // Determine what data to download based on availability and selections - EXACT ADMIN LOGIC
    if (selectedBatch !== 'all') {
      if (selectedSemester !== 'all' || (startDate && endDate)) {
        // Download daily chart data (even if empty, create default structure)
        if (dailyChartData.length > 0) {
          dataToDownload = dailyChartData;
        } else {
          // Create default structure with zero values for the date range
          const { minDate: constraintMin, maxDate: constraintMax } = getDateConstraints();
          let dateRange = { start: new Date(), end: new Date() };
          
          if (startDate && endDate) {
            dateRange = { start: new Date(startDate), end: new Date(endDate) };
          } else if (constraintMin && constraintMax) {
            dateRange = { start: new Date(constraintMin), end: new Date(constraintMax) };
          } else {
            // Default to current month if no constraints
            const now = new Date();
            dateRange = { 
              start: new Date(now.getFullYear(), now.getMonth(), 1),
              end: now
            };
          }
          
          const days = eachDayOfInterval(dateRange);
          dataToDownload = days.map(day => ({
            date: format(day, 'MMM d'),
            studentsOnLeave: 0,
            studentsOnOD: 0
          }));
        }
        
        reportTitle = startDate && endDate 
          ? Daily Leave & OD Report for  - Batch - ( - )
          : Daily Leave & OD Report for  - Batch -, Semester ;
      } else {
        // Download student summary data for the batch
        dataToDownload = tutorStudentData.map(student => ({
          'Student Name': student.name,
          'Register Number': student.register_number,
          'Batch': ${student.batch}-,
          'Semester': student.semester,
          'Tutor': currentTutor?.name || 'N/A',
          'Total Leave Taken': student.leave_taken || 0,
          'Phone': student.mobile || 'N/A',
          'Email': student.email || 'N/A'
        }));
        reportTitle = Student Summary Report for  - Batch -;
        reportType = 'summary';
      }
    } else {
      // Download all tutor students summary when no specific batch is selected
      dataToDownload = tutorStudentData.map(student => ({
        'Student Name': student.name,
        'Register Number': student.register_number,
        'Batch': ${student.batch}-,
        'Semester': student.semester,
        'Tutor': currentTutor?.name || 'N/A',
        'Total Leave Taken': student.leave_taken || 0,
        'Phone': student.mobile || 'N/A',
        'Email': student.email || 'N/A'
      }));
      reportTitle = All Students Summary Report for ;
      reportType = 'summary';
    }

    if (dataToDownload.length === 0) {
      // Even if no data, create a minimal structure - EXACT ADMIN LOGIC
      if (reportType === 'daily') {
        dataToDownload = [{
          date: format(new Date(), 'MMM d'),
          studentsOnLeave: 0,
          studentsOnOD: 0
        }];
      } else {
        dataToDownload = [{
          'Student Name': 'No Data Available',
          'Register Number': 'N/A',
          'Batch': 'N/A',
          'Semester': 'N/A',
          'Tutor': currentTutor?.name || 'N/A',
          'Total Leave Taken': 0,
          'Phone': 'N/A',
          'Email': 'N/A'
        }];
      }
    }

    // Generate timestamp for filename - EXACT ADMIN LOGIC
    const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
    const finalTitle = ${reportTitle}_;

    switch (exportFormat) {
      case 'xlsx':
        const ws = XLSX.utils.json_to_sheet(dataToDownload);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Report');
        XLSX.writeFile(wb, ${finalTitle}.xlsx);
        break;

      case 'csv':
        const csv = Papa.unparse(dataToDownload);
        const csvBlob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const csvUrl = URL.createObjectURL(csvBlob);
        const csvLink = document.createElement('a');
        csvLink.setAttribute('href', csvUrl);
        csvLink.setAttribute('download', ${finalTitle}.csv);
        csvLink.style.display = 'none';
        document.body.appendChild(csvLink);
        csvLink.click();
        document.body.removeChild(csvLink);
        URL.revokeObjectURL(csvUrl);
        break;

      default:
        break;
    }
  };

  if (!currentTutor) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Tutor Data</CardTitle>
          <CardDescription>Please wait while we load your tutor information...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Loading...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls Section */}
      {(showBatchSemesterSelectors || showDatePickers) && (
        <div className="flex flex-col gap-4">
          {/* Batch and Semester Selectors */}
          {showBatchSemesterSelectors && (
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Select value={selectedBatch} onValueChange={handleBatchChange}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Select Batch" />
                </SelectTrigger>
                <SelectContent>
                  {availableBatches.map(batch => (
                    <SelectItem key={batch} value={String(batch)}>
                      {batch === 'all' ? 'All Batches' : ${batch}-}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedSemester} onValueChange={handleSemesterChange} disabled={selectedBatch === 'all'}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Select Semester" />
                </SelectTrigger>
                <SelectContent>
                  {availableSemesters.map(semester => (
                    <SelectItem key={semester} value={String(semester)}>
                      {semester === 'all' ? 'All Semesters' : Semester }
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Date Range Pickers */}
          {showDatePickers && (
            <div className="flex justify-end gap-3">
              <DateRangePicker 
                date={startDate ? new Date(startDate) : undefined} 
                setDate={(date) => setStartDate(date ? date.toISOString().split('T')[0] : '')}
                placeholder="From Date"
                disabled={selectedBatch === 'all' || selectedSemester === 'all'}
                minDate={minDate ? new Date(minDate) : undefined}
                maxDate={endDate ? new Date(endDate) : (maxDate ? new Date(maxDate) : undefined)}
                prevSemesterEndDate={prevSemesterEndDate}
                className="w-40"
              />
              <DateRangePicker 
                date={endDate ? new Date(endDate) : undefined} 
                setDate={(date) => setEndDate(date ? date.toISOString().split('T')[0] : '')}
                placeholder="To Date"
                disabled={selectedBatch === 'all' || selectedSemester === 'all'}
                minDate={startDate ? new Date(startDate) : (minDate ? new Date(minDate) : undefined)}
                maxDate={maxDate ? new Date(maxDate) : undefined}
                className="w-40"
              />
              {(startDate || endDate) && (
                <Button variant="outline" size="sm" onClick={() => { setStartDate(''); setEndDate(''); }}>
                  Clear
                </Button>
              )}
            </div>
          )}

          {/* Download buttons */}
          {showDownloadButtons && (
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => downloadReport('xlsx')}>
                <Download className="h-4 w-4 mr-2" />
                Download XLSX
              </Button>
              <Button variant="outline" size="sm" onClick={() => downloadReport('csv')}>
                <Download className="h-4 w-4 mr-2" />
                Download CSV
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Chart Display */}
      {selectedBatch !== 'all' && selectedSemester !== 'all' ? (
        <DailyLeaveChart 
          data={dailyChartData} 
          title={startDate && endDate 
            ? ${title} for  - Batch - ( - )
            : ${title} for  - Batch -, Semester 
          }
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedBatch === 'all' ? 'Select a Batch and Semester' : 'Select a Semester'}
            </CardTitle>
            <CardDescription>
              {selectedBatch === 'all' 
                ? 'Please select a batch and semester to view the daily leave report.'
                : 'Please select a semester to view the daily leave report. You can also use custom date ranges above.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              {tutorStudentData.length > 0 
                ? You have  students. Select filters above to view their daily leave report.
                : 'No students assigned to you yet.'
              }
            </div>
          </CardContent>
        </Card>
      )}

      {/* Debug Information (for development) */}
      {process.env.NODE_ENV === 'development' && errors.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Debug Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {errors.map((error, index) => (
                <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                  {error}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TutorDailyChart;
