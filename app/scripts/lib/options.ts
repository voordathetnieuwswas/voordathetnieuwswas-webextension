export interface Options {
    enabledProvinces: string[];
    enabledMunicipalities: string[];
    showOverviewIcons: boolean;
    autoOpenPanel: boolean;
    hideWelcomePanel: boolean;
    filterOrganizations: boolean;
}

export interface OptionsParam {
    enabledProvinces?: string[];
    enabledMunicipalities?: string[];
    showOverviewIcons?: boolean;
    autoOpenPanel?: boolean;
    hideWelcomePanel?: boolean;
    filterOrganizations?: boolean;
}

const defaultOptions: Options = {
    enabledProvinces: [],
    enabledMunicipalities: [],
    showOverviewIcons: true,
    autoOpenPanel: true,
    hideWelcomePanel: false,
    filterOrganizations: false
};

export const saveOptions = (options: OptionsParam): Promise<void> => {
    return browser.storage.sync.set(options);
};

export const getOptions = (): Promise<Options> => {
    return browser.storage.sync.get(defaultOptions);
};