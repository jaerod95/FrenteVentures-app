import path from 'path';

export function scriptExportOpenOmniplan(p) {
  return `
activate application "OmniPlan"
tell application "OmniPlan"
set d to window 1
set a to d's scenario's task

------------------------------------------------------
--Generate UUID for each task if it doesn't have one--
------------------------------------------------------
repeat with a_task in a
set task_note to a_task's note
set note_length to length of task_note
if note_length is not equal to 36 then
my getUUID()
set a_task's note to (get result)
end if
end repeat
end tell

-----------------------------
--Export File to tmp folder--
-----------------------------   
set current_path to "${path.resolve(p)}/"
set mac_path to POSIX file current_path
set fileName to "temp"
set mac_path to mac_path as string & fileName
tell application "OmniPlan"
close access (open for access file (mac_path & ".csv"))
export document 1 to mac_path & ".csv" as "CSV"
end tell
----------------------
--Gets a random UUID--
----------------------
on getUUID()
do shell script "uuidgen"
end getUUID
`;
}

export const test = 'TEST';
