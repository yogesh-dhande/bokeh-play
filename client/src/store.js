import axios from "axios";
import Vue from "vue";
import Vuex from "vuex";
import router from "./router.js";

Vue.use(Vuex);

export function treeFromBlobList(blobList) {
  let result = [];
  let level = { result };

  blobList.forEach((blob) => {
    let path = blob.filePath;
    path.split("/").reduce((r, name) => {
      if (!r[name]) {
        r[name] = { result: [] };
        r.result.push({ name, children: r[name].result });
      }

      return r[name];
    }, level);
  });

  return result;
}

const store = new Vuex.Store({
  state: {
    session: {},
    project: {
      id: null,
      name: null,
      user: {},
      blob: [
        {
          relative_path: "main.py",
          text: "",
        },
      ],
    },
    currentUser: {},
    userProfile: {},
    loading: false,
    error: {
      response: {
        status: "404",
        data: {
          message: "Page Not Found",
        },
      },
    },
  },
  getters: {
    canEdit(state) {
      if (!state.currentUser.id) {
        return false;
      }
      return state.currentUser.id == state.project.user.id;
    },
  },
  actions: {
    setCurrentUser({ commit }, uid) {
      console.log(`${process.env.VUE_APP_BACKEND_URL}/user/${uid}`);
      axios
        .get(`${process.env.VUE_APP_BACKEND_URL}/user/${uid}`)
        .then((res) => {
          console.log(res.data);
          commit("setCurrentUser", res.data ? res.data : {});
        })
        .catch((error) => {
          commit("setError", error);
          router.replace("/error");
        });
    },
    updateCode({ commit }, payload) {
      console.log(payload);
      axios
        .put(`${process.env.VUE_APP_BACKEND_URL}/blob`, payload)
        .then((res) => commit("updateBlob", res.data))
        .catch((error) => commit("setError", error));
    },
    createProject({ commit, state, dispatch }, projectName) {
      console.log(`creating project ${projectName}`);
      commit("setLoading", true);
      axios
        .post(`${process.env.VUE_APP_BACKEND_URL}/project`, {
          user: state.currentUser,
          name: projectName,
        })
        .then((res) => {
          console.log(res.data);
          commit("setProject", res.data);
          router.push(`${state.currentUser.name}/${projectName}/code`);
          dispatch("setCurrentUser", state.currentUser.id);
        })
        .finally(() => commit("setLoading", false))
        .catch((error) => {
          commit("setError", error);
          router.replace("/error");
        });
    },
    setProject({ commit, state }, payload) {
      if (
        state.project.name != payload.project_name ||
        state.project.user.name != payload.user_name
      ) {
        commit("setLoading", true);
        console.log(
          `getting project for ${payload.user_name} - ${payload.project_name}`
        );
        axios
          .get(`${process.env.VUE_APP_BACKEND_URL}/project`, {
            params: payload,
          })
          .then((res) => {
            commit("setProject", res.data);
          })
          .catch((error) => {
            commit("setError", error);
            router.replace("/error");
          })
          .finally(() => commit("setLoading", false));
      }
    },
    clearData({ commit }) {
      commit("clearData");
    },
  },
  mutations: {
    setCurrentUser(state, val) {
      state.currentUser = val;
    },
    loadProject(state, payload) {
      state.project.id = payload.id;
      state.project.user = payload.userName;
      state.project.name = payload.projectName;
    },
    addProjectToCurrentUser(state, project) {
      Vue.set(state.currentUser.projects, project.id, project);
    },
    setProject(state, project) {
      state.project = project;
    },
    updateAppScript(state, val) {
      state.appScript = val;
    },
    updateprojectName(state, val) {
      state.projectName = val;
    },
    updateBlob(state, blob) {
      console.log(blob);
      let newBlob = state.project.blob.filter(
        (item) => item.relative_path == "main.py"
      );
      console.log(blob.relative_path);
      newBlob[0].text = blob.text;
    },
    clearData(state) {
      state.currentUser = {};
      state.appScript = null;
    },
    setLoading(state, val) {
      state.loading = val;
    },
    setError(state, val) {
      state.error = val;
    },
  },
});

export default store;
