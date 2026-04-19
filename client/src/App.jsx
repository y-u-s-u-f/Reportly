import { useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
} from "react-router";
import AppShell from "./shell/AppShell.jsx";
import Home from "./screens/Home.jsx";
import MapScreen from "./screens/Map.jsx";
import Activity from "./screens/Activity.jsx";
import ReportDetail from "./screens/ReportDetail.jsx";
import SubmitSheet from "./screens/submit/SubmitSheet.jsx";
import ErrorBoundary from "./shell/ErrorBoundary.jsx";
import { bindAppStoreSideEffects } from "./store/index.js";

export default function App() {
  useEffect(() => bindAppStoreSideEffects(), []);
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <RoutedApp />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

function RoutedApp() {
  const location = useLocation();
  const state = location.state;
  const background = state?.background;
  const showSubmit = location.pathname === "/report" || !!background;
  const mainLocation = background || (location.pathname === "/report" ? { pathname: "/" } : location);

  return (
    <>
      <Routes location={mainLocation}>
        <Route element={<AppShell />}>
          <Route path="/" element={<Home />} />
          <Route path="/map" element={<MapScreen />} />
          <Route path="/activity" element={<Activity />} />
          <Route path="/r/:id" element={<ReportDetail />} />
          <Route path="*" element={<Home />} />
        </Route>
      </Routes>
      {location.pathname === "/report" && <SubmitSheet />}
    </>
  );
}
