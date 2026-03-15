import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/AppLayout";
import { ThemeProvider } from "@/lib/theme";
import NotFound from "@/pages/not-found";

import Dashboard from "@/pages/Dashboard";
import SectionPage from "@/pages/SectionPage";
import PortfolioPage from "@/pages/PortfolioPage";
import WatchlistPage from "@/pages/WatchlistPage";
import SearchPage from "@/pages/SearchPage";
import BooksPage from "@/pages/BooksPage";
import ResourcesPage from "@/pages/ResourcesPage";
import RoadmapPage from "@/pages/RoadmapPage";
import InvestorsPage from "@/pages/InvestorsPage";
import SettingsPage from "@/pages/SettingsPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/search" component={SearchPage} />
        <Route path="/portfolio" component={PortfolioPage} />
        <Route path="/watchlist" component={WatchlistPage} />
        <Route path="/books" component={BooksPage} />
        <Route path="/resources" component={ResourcesPage} />
        <Route path="/roadmap" component={RoadmapPage} />
        <Route path="/investors" component={InvestorsPage} />
        <Route path="/settings" component={SettingsPage} />
        <Route path="/sections/:slug" component={SectionPage} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
