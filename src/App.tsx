import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { PluginList } from "./pages/PluginList";
import { PluginDetail } from "./pages/PluginDetail";

export function App() {
  return (
    <BrowserRouter basename="/jenkins-plugin-modernizer-stats">
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="plugins" element={<PluginList />} />
          <Route path="plugin/:name" element={<PluginDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
