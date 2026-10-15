import "../src/app/globals.css";

const preview = {
  decorators: [
    (Story: any) => (
      <div className="font-sans">
        <Story />
      </div>
    ),
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
