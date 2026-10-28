import type { ReactElement } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

/**
 * Root application component.
 * Routes are added per feature unit — see .ai/ai-workflow-rules.md build order.
 */
function App(): ReactElement {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
              <h1 className="text-brand-700 text-3xl font-bold">Campus Lost &amp; Found</h1>
              <p className="mt-2 text-gray-500">Setting up — routes coming soon.</p>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
