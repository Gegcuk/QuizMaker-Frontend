import React, { useEffect, useLayoutEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  captureSensitiveReturn,
  shouldSanitizeSensitiveLocation,
} from './sensitiveReturn';

interface SensitiveUrlBoundaryProps {
  children: React.ReactNode;
}

const SensitiveUrlBoundary: React.FC<SensitiveUrlBoundaryProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const shouldSanitize = shouldSanitizeSensitiveLocation(location);

  useLayoutEffect(() => {
    if (!shouldSanitize) return;

    captureSensitiveReturn(location);

    const isBrowserLocation = window.location.pathname === location.pathname
      && window.location.search === location.search
      && window.location.hash === location.hash;
    if (isBrowserLocation) {
      window.history.replaceState(window.history.state, '', location.pathname);
    }
  }, [location, shouldSanitize]);

  useEffect(() => {
    if (!shouldSanitize) return;

    navigate({
      pathname: location.pathname,
      search: '',
      hash: '',
    }, {
      replace: true,
      state: location.state,
    });
  }, [location, navigate, shouldSanitize]);

  return shouldSanitize ? null : <>{children}</>;
};

export default SensitiveUrlBoundary;
