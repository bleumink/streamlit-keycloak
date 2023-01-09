export interface LabelMap {
    labelButton?: string
    labelLogin?: string
    errorNoPopup?: string
    errorPopupClosed?: string
    errorFatal?: string
}

export const defaultLabels: LabelMap = {
    labelButton: 'Sign in',
    labelLogin: 'Please sign in to your account.',
    errorNoPopup:
        'Unable to open the authentication popup. Allow popups and refresh the page to proceed.',
    errorPopupClosed: 'Authentication popup was closed manually.',
    errorFatal:
        'Unable to connect to Keycloak using the current configuration.',
}
