export const state = () => ({
  currentTheme: 'light', // Default theme
  isAdmin: false, // Admin flag
});

export const mutations = {
  SET_THEME(state, theme) {
    state.currentTheme = theme;
  },
  TOGGLE_ADMIN(state) {
    state.isAdmin = !state.isAdmin;
  },
};

export const actions = {
  setTheme({ commit }, theme) {
    commit('SET_THEME', theme);
  },
  toggleAdmin({ commit }) {
    commit('TOGGLE_ADMIN');
  },
};

export const getters = {
  currentTheme: (state) => state.currentTheme,
  isAdmin: (state) => state.isAdmin,
};