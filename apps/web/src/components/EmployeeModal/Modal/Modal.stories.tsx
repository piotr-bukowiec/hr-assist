import { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { EmployeeModal } from "./Modal";

const meta: Meta<typeof EmployeeModal> = {
  title: "Modals/EmployeeModal",
  component: EmployeeModal,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    mode: "create",
    onClose: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof EmployeeModal>;

export const Open: Story = {
  args: {
    isOpen: true,
  },
};

export const Closed: Story = {
  args: {
    isOpen: false,
  },
};
