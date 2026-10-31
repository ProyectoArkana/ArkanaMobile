export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Main: undefined;
  NfcScan: undefined;
  Matchmaking: undefined;
  Deck: undefined; // ARK-020: mazo activo
  MatchScreen: {
    matchId: string;
    opponent: { userId: string; username: string };
  };
  // ARK-011: administración de usuarios (solo rol ADMIN)
  AdminUsers: undefined;
  AdminUserDetail: { userId: string };
  AdminUserCreate: undefined;
};

export type MainTabParamList = {
  Gallery: undefined;
  Search: undefined;
  Arena: undefined;
  Profile: undefined;
};
