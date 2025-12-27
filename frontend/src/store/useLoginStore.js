import { create } from "zustand";
import { persist } from "zustand/middleware";

const useLoginStore = create(
  persist(
    (set,get) => ({
      step: 1,
      userPhoneData: null,
      userData: null, // Store user data from OTP verification
      setStep: (step) => {
        console.log('useLoginStore.setStep called with:', step);
        set({ step });
        console.log('useLoginStore.step now:', get().step);
      },
      setUserPhoneData: (data) => set({ userPhoneData: data }),
      setUserData: (data) => set({ userData: data }),
      resetLoginState: () => set({ step: 1, userPhoneData: null, userData: null }),
    }),
    {
      name: "login-storage",
      // persist login step only for this tab/session to avoid stale cross-window rehydration
      getStorage: () => sessionStorage,
      partialize: (state) => ({
        step: state.step,
        userPhoneData: state.userPhoneData,
        userData: state.userData,
      }),
    }
  )
);

export default useLoginStore;
