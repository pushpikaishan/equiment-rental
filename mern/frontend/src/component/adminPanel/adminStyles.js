// Shared admin panel styles to keep management pages consistent with the dashboard

export const pageContainer = {
  display: 'block',
};

export const headerCard = {
  background: 'white',
  padding: '30px',
  borderRadius: '16px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
  marginBottom: '30px',
};

export const headerTitle = {
  fontSize: '32px',
  fontWeight: 700,
  color: '#1e293b',
  margin: '0 0 8px 0',
};

export const headerSub = {
  color: '#64748b',
  margin: 0,
};

export const card = {
  background: 'white',
  padding: 20,
  borderRadius: 16,
  border: '2px solid #f1f5f9',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
};

export const gridAutoFit = (min = 250) => ({
  display: 'grid',
  gridTemplateColumns: `repeat(auto-fit, minmax(${min}px, 1fr))`,
  gap: 20,
});

export const subtleLabel = {
  color: '#64748b',
  fontSize: 14,
};

export const input = {
  padding: 10,
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  background: 'white',
};

export const select = input;

export const toolbar = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  flexWrap: 'wrap',
};

export const btn = (bg = '#2563eb', color = 'white') => ({
  background: bg,
  color,
  border: 'none',
  padding: '8px 12px',
  borderRadius: 8,
  cursor: 'pointer',
});

export const btnOutlined = (color = '#334155') => ({
  background: 'white',
  color,
  border: `1px solid ${color}30`,
  padding: '8px 12px',
  borderRadius: 8,
  cursor: 'pointer',
});

export const tabButton = (active) => ({
  padding: '12px 20px',
  borderRadius: 8,
  border: 'none',
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 600,
  transition: 'all 0.3s ease',
  background: active ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' : '#f1f5f9',
  color: active ? 'white' : '#64748b',
});

export const tableBase = {
  width: '100%',
  borderCollapse: 'collapse',
};

export const tableHeaderRow = {
  background: '#f1f5f9',
  textAlign: 'left',
};

export const chip = (bg, color) => ({
  padding: '2px 8px',
  borderRadius: 999,
  background: bg,
  color,
  fontWeight: 600,
  fontSize: 12,
  textTransform: 'capitalize',
});
