import ChecklistScreen from "../screens/ChecklistScreen";

// Export a navigator component that renders the checklist screen.
// This avoids placing JSX at the module top-level which causes TSX/compile errors.
export default function AppNavigator() {
  return <ChecklistScreen />;
}
