import { useEffect, useMemo, useRef, useState } from 'react';
import type { SystemFeature } from '../../types/welcome';

/**
 * Quản lý trạng thái System Launcher (bảng điều hướng tính năng).
 * Được dùng chung bởi HomeView và UserProfileView (khử trùng lặp).
 *
 * Bao gồm:
 * - State mở/đóng launcher
 * - Tìm kiếm tính năng
 * - useMemo: filteredFeatures + featureGroups
 * - Refs: nút mở launcher, input tìm kiếm
 * - useEffect: focus + keyboard Escape + body overflow lock
 */
export function useLauncher(features: SystemFeature[], lockBodyScroll = false) {
  const [launcherOpen, setLauncherOpen] = useState(false);
  const [featureSearch, setFeatureSearch] = useState('');
  const launcherButtonRef = useRef<HTMLButtonElement>(null);
  const launcherSearchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!launcherOpen) return;
    const trigger = launcherButtonRef.current;
    let previousOverflow: string | undefined;

    if (lockBodyScroll) {
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }

    requestAnimationFrame(() => launcherSearchRef.current?.focus());

    const close = (event: KeyboardEvent) =>
      event.key === 'Escape' && setLauncherOpen(false);
    window.addEventListener('keydown', close);

    return () => {
      if (lockBodyScroll && previousOverflow !== undefined) {
        document.body.style.overflow = previousOverflow;
      }
      window.removeEventListener('keydown', close);
      trigger?.focus();
    };
  }, [launcherOpen, lockBodyScroll]);

  const filteredFeatures = useMemo(() => {
    const query = featureSearch.trim().toLocaleLowerCase('vi');
    if (!query) return features;
    return features.filter((feature) =>
      `${feature.title} ${feature.description} ${feature.group}`
        .toLocaleLowerCase('vi')
        .includes(query),
    );
  }, [features, featureSearch]);

  const featureGroups = useMemo(
    () =>
      filteredFeatures.reduce<Record<string, SystemFeature[]>>((groups, feature) => {
        (groups[feature.group] ??= []).push(feature);
        return groups;
      }, {}),
    [filteredFeatures],
  );

  return {
    launcherOpen,
    featureSearch,
    filteredFeatures,
    featureGroups,
    launcherButtonRef,
    launcherSearchRef,
    openLauncher: () => setLauncherOpen(true),
    closeLauncher: () => setLauncherOpen(false),
    toggleLauncher: () => setLauncherOpen((open) => !open),
    setFeatureSearch,
  };
}
