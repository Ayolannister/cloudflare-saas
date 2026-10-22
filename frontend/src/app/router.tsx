import { createBrowserRouter } from 'react-router';
import { AppLayout, HomeRoute } from '../pages/AppLayout';
import { FilesPage } from '../pages/FilesPage';
import { Landing } from '../pages/Landing';
import { NotFound } from '../pages/NotFound';
import { ProjectPage } from '../pages/ProjectPage';
import { ProjectsIndex, ProjectsLayout } from '../pages/ProjectsLayout';

export const router = createBrowserRouter([
  { path: '/', element: <HomeRoute landing={<Landing />} /> },
  {
    element: <AppLayout />,
    children: [
      {
        path: '/projects',
        element: <ProjectsLayout />,
        children: [
          { index: true, element: <ProjectsIndex /> },
          { path: ':projectId', element: <ProjectPage /> },
        ],
      },
      { path: '/files', element: <FilesPage /> },
    ],
  },
  { path: '*', element: <NotFound /> },
]);
