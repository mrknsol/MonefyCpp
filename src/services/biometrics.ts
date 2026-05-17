import ReactNativeBiometrics from 'react-native-biometrics';

const rnBiometrics = new ReactNativeBiometrics({ allowDeviceCredentials: true });

export type BiometricKind = 'FaceID' | 'TouchID' | 'Biometrics' | 'none';

export async function getBiometricKind(): Promise<BiometricKind> {
  try {
    const { available, biometryType } = await rnBiometrics.isSensorAvailable();
    if (!available || !biometryType) {
      return 'none';
    }
    if (biometryType === 'FaceID') {
      return 'FaceID';
    }
    if (biometryType === 'TouchID') {
      return 'TouchID';
    }
    return 'Biometrics';
  } catch {
    return 'none';
  }
}

export async function authenticateWithBiometrics(
  promptMessage: string,
): Promise<boolean> {
  try {
    const { available } = await rnBiometrics.isSensorAvailable();
    if (!available) {
      return false;
    }
    const { success } = await rnBiometrics.simplePrompt({ promptMessage });
    return success;
  } catch {
    return false;
  }
}
