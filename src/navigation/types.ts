export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Main: undefined;
  NfcScan: undefined;
  Matchmaking: undefined;
  MatchScreen: {
    matchId: string;
    opponent: { userId: string; username: string };
  };
};

export type MainTabParamList = {
  Gallery: undefined;
  Arena: undefined;
  Profile: undefined;
};
