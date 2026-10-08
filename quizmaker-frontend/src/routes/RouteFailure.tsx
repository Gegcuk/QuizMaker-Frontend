import { useRouteError } from 'react-router-dom';

/** Forward router-caught failures to the shared privacy-safe error boundary. */
export default function RouteFailure(): never {
  throw useRouteError();
}
