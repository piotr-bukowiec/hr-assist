import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TabsContent } from "@/components/ui/tabs";
import { Leave } from "@/types";

interface EmployeeLeaveTabProps {
  leaveData?: Leave;
}

export function EmployeeLeaveTab({ leaveData }: EmployeeLeaveTabProps) {
  return (
    <TabsContent value="urlopy" className="flex items-center gap-4">
      <div className="invisible w-10 shrink-0">
        <Button variant="outline" size="icon">
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid flex-1 grid-cols-2 gap-3">
        {/* Urlop zaległy */}
        <Card className="flex flex-col items-center justify-center gap-2 bg-muted/40 p-3.5">
          <h3 className="text-sm font-semibold">Urlop zaległy</h3>
          <Progress
            value={
              leaveData?.overdue.base && leaveData.overdue.base > 0
                ? (leaveData.overdue.used / leaveData.overdue.base) * 100
                : 0
            }
            className="w-3/4"
          />
          <span className="text-xs font-medium text-muted-foreground">
            {leaveData?.overdue.used ?? 0} / {leaveData?.overdue.base ?? 0} dni
          </span>
        </Card>

        {/* Urlop aktualny */}
        <Card className="flex flex-col items-center justify-center gap-2 bg-muted/40 p-3.5">
          <h3 className="text-sm font-semibold">Urlop aktualny</h3>
          <Progress
            value={
              leaveData?.current.base && leaveData.current.base > 0
                ? (leaveData.current.used / leaveData.current.base) * 100
                : 0
            }
            className="w-3/4"
          />
          <span className="text-xs font-medium text-muted-foreground">
            {leaveData?.current.used ?? 0} / {leaveData?.current.base ?? 0} dni
          </span>
        </Card>
      </div>

      <div className="invisible w-10 shrink-0">
        <Button variant="outline" size="icon">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </TabsContent>
  );
}
