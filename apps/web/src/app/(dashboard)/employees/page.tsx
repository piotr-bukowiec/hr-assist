"use client";

import { EmployeeModal } from "@/components/EmployeeModal/Modal/Modal";
import List from "@/components/Employees/List";
import { Search } from "@/components/Employees/Search";
import { useState } from "react";

export default function EmployeesPage() {
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);
  const handleAddEmployee = () => {
    setIsAddingEmployee(true);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <Search onAddClick={handleAddEmployee} />
      <List />
      <EmployeeModal
        mode="create"
        isOpen={isAddingEmployee}
        onClose={() => setIsAddingEmployee(false)}
      />
    </div>
  );
}
