/* eslint-env jest */
jest.mock('react-native-nfc-manager', () => ({
  __esModule: true,
  default: {
    start: jest.fn().mockResolvedValue(undefined),
    isSupported: jest.fn().mockResolvedValue(true),
    requestTechnology: jest.fn().mockResolvedValue(undefined),
    cancelTechnologyRequest: jest.fn().mockResolvedValue(undefined),
    getTag: jest.fn().mockResolvedValue({ id: 'MOCK-TAG-001' }),
  },
  NfcTech: {
    Ndef: 'Ndef',
    Nfca: 'Nfca',
  },
}));

jest.mock('react-native-keychain', () => ({
  setGenericPassword: jest.fn().mockResolvedValue(true),
  getGenericPassword: jest.fn().mockResolvedValue(false),
  resetGenericPassword: jest.fn().mockResolvedValue(true),
}));