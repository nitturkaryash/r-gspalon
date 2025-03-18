import { DashboardSettings as DashboardSettingsType } from '../../hooks/useDashboardAnalytics';
interface DashboardSettingsProps {
    settings: DashboardSettingsType;
    onSettingsChange: (newSettings: Partial<DashboardSettingsType>) => void;
    onRefresh: () => void;
}
export default function DashboardSettings({ settings, onSettingsChange, onRefresh, }: DashboardSettingsProps): import("react/jsx-runtime").JSX.Element;
export {};
