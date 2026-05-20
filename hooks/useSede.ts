import { useGlobal } from '@/context/GlobalContext';

export function useSede() {
  const { configSede, refreshSede } = useGlobal();
  return { configSede, refreshSede };
}
