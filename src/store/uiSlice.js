import { createSlice } from '@reduxjs/toolkit';
const initialState = { sidebarOpen: false, commandOpen: false, selectedLanguage: 'auto' };
const uiSlice = createSlice({
  name: 'ui', initialState,
  reducers: {
    setSidebarOpen: (state, action) => { state.sidebarOpen = action.payload; },
    toggleSidebar: (state) => { state.sidebarOpen = !state.sidebarOpen; },
    setCommandOpen: (state, action) => { state.commandOpen = action.payload; },
    setSelectedLanguage: (state, action) => { state.selectedLanguage = action.payload; },
  },
});
export const { setSidebarOpen, toggleSidebar, setCommandOpen, setSelectedLanguage } = uiSlice.actions;
export default uiSlice.reducer;
