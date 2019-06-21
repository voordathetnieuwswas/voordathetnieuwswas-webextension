export interface Options {
    enabledProvinces: string[];
    enabledMunicipalities: string[];
    showOverviewIcons: boolean;
    autoOpenPanel: boolean;
    hideWelcomePanel: boolean;
    filterOrganizations: boolean;
}

export type OptionsParam = Partial<Options>;

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
