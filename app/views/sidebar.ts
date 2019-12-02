import { CacheItem } from '../entities/handlers';
import { getOptions, Options, OptionsParam, saveOptions } from '../scripts/lib/options';
import { BasicOrganizations, findOrganizationsBasic, MediaObject } from '../scripts/lib/openstate';
import { init } from '../scripts/contentscript';

export const buildSidebar = (
    results: CacheItem | null,
    siteSupported: boolean = false,
    autoOpen: boolean = false,
    options: Options,
    organizations: BasicOrganizations
) => {
    const iframe = document.createElement('iframe');
    iframe.className = 'vhnw-frame';
    iframe.onload = function () {
        const self = this as HTMLIFrameElement;
        if (self.contentWindow) {
            const doc = self.contentWindow.document;
            const stylesheet = document.createElement('link') as HTMLLinkElement;
            stylesheet.rel = 'stylesheet';
            stylesheet.href = browser.extension.getURL('styles/sidebar.css');
            stylesheet.type = 'text/css';
            doc.head.appendChild(stylesheet);
            doc.body.style.display = 'none';
            doc.body.appendChild(sidebarContent(results, siteSupported, options, organizations));

            // Hide body until CSS is loaded to avoid FOUC
            stylesheet.addEventListener('load', () => {
                doc.body.style.display = 'initial';
            });

            const closeButton = doc.body.querySelector('.control.close');
            closeButton && closeButton.addEventListener('click', () => {
                iframe.style.display = 'none';
            });
        }
    };

    iframe.style.display = autoOpen ? 'initial' : 'none';

    document.body.appendChild(iframe);
};

export const updateSidebarResults = (
    results: CacheItem | null,
    options: Options,
    organizations: BasicOrganizations
): void => {
    const iframeElem = document.querySelector('iframe.vhnw-frame') as HTMLIFrameElement;
    if (!iframeElem || !iframeElem.contentWindow) {
        return;
    }
    const resultsElem = iframeElem.contentWindow.document.querySelector('.content.results');
    if (!resultsElem) {
        return;
    }

    resultsElem.replaceWith(resultsElement(results, true, options, organizations));
};

const sidebarContent = (
    results: CacheItem | null,
    siteSupported: boolean,
    options: Options,
    organizations: BasicOrganizations
): HTMLElement => {
    const container = document.createElement('div');
    container.className = 'container';

    // Results panel
    const resultsPanel = document.createElement('div');
    resultsPanel.className = 'results-panel panel';
    container.appendChild(resultsPanel);

    const resultsHeader = document.createElement('header');
    resultsHeader.className = 'app-title fixed';
    resultsPanel.appendChild(resultsHeader);

    const closeActionContainer = document.createElement('div');
    closeActionContainer.className = 'action';
    resultsHeader.appendChild(closeActionContainer);

    const closeAction = document.createElement('span');
    closeAction.className = 'control close';
    closeActionContainer.appendChild(closeAction);

    const closeImg = document.createElement('img') as HTMLImageElement;
    closeImg.src = browser.extension.getURL('images/close.svg');
    closeAction.appendChild(closeImg);

    const logoContainer = document.createElement('div');
    logoContainer.className = 'action logo-container';
    resultsHeader.appendChild(logoContainer);

    const logo = document.createElement('img') as HTMLImageElement;
    logo.src = browser.extension.getURL('images/logo.svg');
    logoContainer.appendChild(logo);

    const betaLabel = document.createElement('span');
    betaLabel.className = 'beta-label';
    betaLabel.innerText = 'BETA';
    logoContainer.appendChild(betaLabel);

    const settingsActionContainer = document.createElement('div');
    settingsActionContainer.className = 'action';
    resultsHeader.appendChild(settingsActionContainer);

    const settingsAction = document.createElement('span');
    settingsAction.className = 'control';
    settingsAction.addEventListener('click', (event: MouseEvent) => {
        event.preventDefault();
        resultsPanel.style.display = 'none';
        settingsPanel.style.display = 'flex';
    });
    settingsActionContainer.appendChild(settingsAction);

    const settingsImg = document.createElement('img') as HTMLImageElement;
    settingsImg.src = browser.extension.getURL('images/settings.svg');
    settingsAction.appendChild(settingsImg);

    resultsPanel.appendChild(resultsElement(results, siteSupported, options, organizations));

    // Settings panel
    const settingsPanel = document.createElement('div');
    settingsPanel.className = 'settings-panel panel';
    container.appendChild(settingsPanel);

    const settingsHeader = document.createElement('header');
    settingsHeader.className = 'app-title fixed';
    settingsPanel.appendChild(settingsHeader);

    const backActionContainer = document.createElement('div');
    backActionContainer.className = 'action';
    settingsHeader.appendChild(backActionContainer);

    const backAction = document.createElement('span');
    backAction.className = 'control';
    backAction.addEventListener('click', (event: MouseEvent) => {
        event.preventDefault();
        resultsPanel.style.display = 'flex';
        settingsPanel.style.display = 'none';
    });
    backActionContainer.appendChild(backAction);

    const backImg = document.createElement('img') as HTMLImageElement;
    backImg.src = browser.extension.getURL('images/back.svg');
    backAction.appendChild(backImg);

    const settingsTitleContainer = document.createElement('div');
    settingsTitleContainer.className = 'action';
    settingsHeader.appendChild(settingsTitleContainer);

    const settingsTitle = document.createElement('h1');
    settingsTitle.innerText = 'Instellingen';
    settingsTitleContainer.appendChild(settingsTitle);

    const dummyActionContainer = document.createElement('div');
    dummyActionContainer.className = 'action';
    settingsHeader.appendChild(dummyActionContainer);

    const dummyAction = document.createElement('span');
    dummyAction.className = 'control';
    dummyActionContainer.appendChild(dummyAction);

    settingsPanel.appendChild(settingsContent(options, organizations));

    browser.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'sync') {
            refreshSettings();
            init();
        }
    });

    return container;
};

const resultsElement = (
    results: CacheItem | null,
    siteSupported: boolean,
    options: Options,
    organizations: BasicOrganizations
): HTMLElement => {
    let resultsElem: HTMLElement;

    if (siteSupported) {
        if (results && results.results) {
            resultsElem = document.createElement('div');
            if (results.results.length > 0) {
                resultsElem = resultsContent(results.results, results.keywords, organizations);
            } else {
                resultsElem = noResultsContent(results.keywords);
            }
        } else {
            resultsElem = notArticleContent();
        }
    } else {
        resultsElem = siteNotSupportedContent();
    }

    if (!options.hideWelcomePanel) {
        resultsElem = welcomeContent(resultsElem);
    }

    return resultsElem;
};

/*
const footer = (): HTMLElement => {
    const container = document.createElement('div');
    container.className = 'footer fixed';

    const link = document.createElement('a') as HTMLAnchorElement;
    link.href = 'https://www.oberon.nl';
    link.target = '_blank';
    link.innerText = 'Gemaakt door Oberon';
    container.appendChild(link);

    return container;
};
*/

const noResultsContent = (keywords: string[]) => {
    const label = document.createElement('p');
    label.className = 'keywords-label';
    label.innerText = keywords.length ? 'Gebruikte zoektermen:' : 'Er konden niet genoeg zoektermen worden gevonden';

    const keywordElem = document.createElement('p');
    keywordElem.className = 'keywords';
    keywordElem.innerText = keywords.join(', ');

    const link = document.createElement('a') as HTMLAnchorElement;
    link.href = 'https://zoek.openstateninformatie.nl';
    link.target = '_blank';
    link.innerHTML = 'Zoek op Open Stateninformatie &rarr;';

    return fullPanelContent('Helaas, bij dit artikel zijn geen resultaten gevonden', [
        label,
        keywordElem,
        link,
    ]);
};

const siteNotSupportedContent = () => {
    const link = document.createElement('a') as HTMLAnchorElement;
    link.href = 'https://www.voordathetnieuwswas.nl';
    link.target = '_blank';
    link.innerHTML = 'Bekijk de ondersteunde sites &rarr;';

    return fullPanelContent('Bij deze website werkt deze extensie niet', [link]);
};

const notArticleContent = () => {
    return fullPanelContent('Bezoek de detailpagina van een nieuwsartikel om hier de gevonden resultaten te zien.', undefined, false);
};

const welcomeContent = (replacementContent: HTMLElement): HTMLElement => {
    const welcome1 = document.createElement('p');
    welcome1.innerText = 'De app is geïnstalleerd en zoekt vanaf nu stukken bij nieuws op verschillende nieuwssites.';
    welcome1.style.marginBottom = '0';

    const welcome2 = document.createElement('p');
    welcome2.innerText = 'Op dit moment doorzoekt deze app alléén de Open Stateninformatie; stukken van de provinciale staten.';
    welcome2.style.marginBottom = '30px';

    const personalizeTitle = document.createElement('h2');
    personalizeTitle.className = 'document-title';
    personalizeTitle.innerText = 'Personaliseer';

    const personalize = document.createElement('p');
    personalize.innerText = 'Door bij de instellingen de app te personaliseren, kan deze ook zoeken in de Open Raadsinformatie; stukken van de selecteerde gemeenteraad.';
    personalize.style.marginBottom = '0';

    const link = document.createElement('a') as HTMLAnchorElement;
    link.innerHTML = 'Naar instellingen &rarr;';
    link.href = '#';

    const elem = fullPanelContent('Welkom', [
        welcome1,
        welcome2,
        personalizeTitle,
        personalize,
        link
    ], false);

    link.addEventListener('click', (event: MouseEvent) => {
        event.preventDefault();
        saveOptions({
            hideWelcomePanel: true,
        }).then(() => {
            const resultsPanel = elem.parentElement;
            if (resultsPanel && resultsPanel.parentElement) {
                const settingsPanel = resultsPanel.parentElement.querySelector('.settings-panel') as HTMLDivElement;
                if (settingsPanel) {
                    resultsPanel.style.display = 'none';
                    settingsPanel.style.display = 'flex';
                }
            }

            elem.replaceWith(replacementContent);
        });
    });

    return elem;
};

const fullPanelContent = (title: string, content?: HTMLElement[], showSadFace = true): HTMLElement => {
    const container = document.createElement('div');
    container.className = 'content results full-panel';

    if (showSadFace) {
        const img = document.createElement('img') as HTMLImageElement;
        img.src = browser.extension.getURL('images/sadface.svg');
        img.alt = 'Geen resultaten';
        container.appendChild(img);
    }

    const titleElem = document.createElement('h2');
    titleElem.className = 'document-title';
    titleElem.innerText = title;
    container.appendChild(titleElem);

    if (content) {
        content.map(elem => {
            container.appendChild(elem);
        });
    }

    return container;
};

const addloadingOverlay = (container: HTMLElement | null): void => {
    if (!container) {
        return;
    }

    const overlay = document.createElement('div') as HTMLDivElement;
    overlay.className = 'loading-overlay';
    const spinner = document.createElement('img') as HTMLImageElement;
    spinner.src = browser.extension.getURL('images/icon.svg');
    overlay.appendChild(spinner);

    container.classList.add('loading');
    container.appendChild(overlay);
};

const refreshSettings = () => {
    Promise.all([getOptions(), findOrganizationsBasic()]).then(([options, organizations]) => {
        const iframeElem = document.querySelector('iframe.vhnw-frame') as HTMLIFrameElement;
        if (!iframeElem || !iframeElem.contentWindow) {
            return;
        }
        const settingsElem = iframeElem.contentWindow.document.querySelector('.content.settings');
        if (!settingsElem) {
            return;
        }

        settingsElem.replaceWith(settingsContent(options, organizations));
    });
};

const settingsContent = (options: Options, organizations: BasicOrganizations) => {
    const container = document.createElement('div');
    container.className = 'content settings';

    const switchItem = (label: string, optionKey: 'showOverviewIcons' | 'autoOpenPanel' | 'filterOrganizations') => {
        const currentValue = options[optionKey];
        const element = document.createElement('div');
        element.className = 'settings-item clickable';
        element.setAttribute('data-option-key', optionKey);
        element.setAttribute('data-value', currentValue ? 'true' : 'false');

        const labelElem = document.createElement('span');
        labelElem.innerText = label;
        element.appendChild(labelElem);

        const switchElem = document.createElement('img') as HTMLImageElement;
        switchElem.className = 'switch';
        switchElem.alt = 'switch';
        switchElem.src = browser.extension.getURL(`images/switch-${currentValue ? 'on' : 'off'}.svg`);
        element.appendChild(switchElem);
        element.onclick = () => {
            addloadingOverlay(element.parentElement);
            const option: OptionsParam = {};
            option[optionKey] = !currentValue;

            saveOptions(option);
        };

        return element;
    };

    const showOverviewIcons = document.createElement('li');
    showOverviewIcons.className = 'sidebar-item';
    showOverviewIcons.appendChild(switchItem('Indicators bij nieuwskoppen', 'showOverviewIcons'));
    const showOverviewIconsInfo = document.createElement('p');
    showOverviewIconsInfo.className = 'info';
    showOverviewIconsInfo.innerText = 'Bij nieuwskoppen op bijvoorbeeld overzichtspagina\'s tonen dat er resultaten zijn.';
    showOverviewIcons.appendChild(showOverviewIconsInfo);
    container.appendChild(showOverviewIcons);

    const autoOpenPanel = document.createElement('li');
    autoOpenPanel.className = 'sidebar-item';
    autoOpenPanel.appendChild(switchItem('Resultaten direct tonen', 'autoOpenPanel'));
    const autoOpenPanelInfo = document.createElement('p');
    autoOpenPanelInfo.className = 'info';
    autoOpenPanelInfo.innerText = 'Het paneel op artikelpagina\'s automatisch openen wanneer er resultaten zijn.';
    autoOpenPanel.appendChild(autoOpenPanelInfo);
    container.appendChild(autoOpenPanel);

    const personalize = document.createElement('li');
    personalize.className = 'sidebar-item';
    personalize.appendChild(switchItem('Personaliseren', 'filterOrganizations'));
    const personalizeInfo = document.createElement('p');
    personalizeInfo.className = 'info';
    personalizeInfo.innerText = 'Resultaten beperken tot geselecteerde provincies en gemeentes.\nIndien uitgeschakeld krijgt u resultaten voor alle ondersteunde provincies.';
    personalize.appendChild(personalizeInfo);

    if (options.filterOrganizations) {
        const provinceHeading = document.createElement('h4');
        provinceHeading.innerText = 'Provincies';
        provinceHeading.className = 'sub-heading';
        personalize.appendChild(provinceHeading);

        const provinceSelect = document.createElement('select');
        provinceSelect.className = 'organization-select clickable';
        provinceSelect.addEventListener('change', () => {
            addloadingOverlay(personalize);
            getOptions().then(updatedOptions => {
                const enabledProvinces = updatedOptions.enabledProvinces;
                const index = enabledProvinces.indexOf(provinceSelect.value);
                if (index === -1) {
                    enabledProvinces.push(provinceSelect.value);
                }
                saveOptions({ enabledProvinces });
            });
        });
        const provinceDefault = document.createElement('option') as HTMLOptionElement;
        provinceDefault.selected = true;
        provinceDefault.disabled = true;
        provinceDefault.innerText = 'Voeg een provincie toe...';
        provinceSelect.appendChild(provinceDefault);
        let provincesSelected = false;

        Object.entries(organizations.provinces).map(([collection, province]) => {
            const currentValue = options.enabledProvinces.includes(collection);
            const provinceName = province.replace('Provincie ', '');
            if (currentValue) {
                provincesSelected = true;
                const provinceElem = document.createElement('div');
                provinceElem.className = 'settings-item organization-item';

                const label = document.createElement('span');
                label.className = 'label';
                label.innerText = provinceName;
                provinceElem.appendChild(label);

                const deleteButton = document.createElement('img') as HTMLImageElement;
                deleteButton.className = 'clickable';
                deleteButton.src = browser.extension.getURL('images/close-small.svg');
                deleteButton.alt = 'Verwijder';
                deleteButton.addEventListener('click', () => {
                    addloadingOverlay(personalize);
                    getOptions().then(updatedOptions => {
                        const enabledProvinces = updatedOptions.enabledProvinces;
                        const index = enabledProvinces.indexOf(collection);
                        if (index !== -1) {
                            enabledProvinces.splice(index, 1);
                        }
                        saveOptions({ enabledProvinces });
                    });
                });
                provinceElem.appendChild(deleteButton);

                personalize.appendChild(provinceElem);
            } else {
                const provinceOption = document.createElement('option') as HTMLOptionElement;
                provinceOption.innerText = provinceName;
                provinceOption.value = collection;

                provinceSelect.appendChild(provinceOption);
            }
        });
        if (!provincesSelected) {
            const noneSelected = document.createElement('p');
            noneSelected.className = 'no-entries';
            noneSelected.innerText = 'Geen provincies geselecteerd';
            personalize.appendChild(noneSelected);
        }
        personalize.appendChild(provinceSelect);

        const municipalityHeading = document.createElement('h4');
        municipalityHeading.innerText = 'Gemeentes';
        municipalityHeading.className = 'sub-heading';
        personalize.appendChild(municipalityHeading);

        const municipalitySelect = document.createElement('select');
        municipalitySelect.className = 'organization-select clickable';
        municipalitySelect.addEventListener('change', () => {
            addloadingOverlay(personalize);
            getOptions().then(updatedOptions => {
                const enabledMunicipalities = updatedOptions.enabledMunicipalities;
                const index = enabledMunicipalities.indexOf(municipalitySelect.value);
                if (index === -1) {
                    enabledMunicipalities.push(municipalitySelect.value);
                }
                saveOptions({ enabledMunicipalities });
            });
        });
        const municipalityDefault = document.createElement('option') as HTMLOptionElement;
        municipalityDefault.selected = true;
        municipalityDefault.disabled = true;
        municipalityDefault.innerText = 'Voeg een gemeente toe...';
        municipalitySelect.appendChild(municipalityDefault);
        let municipalitiesSelected = false;

        Object.entries(organizations.municipalities).map(([collection, municipality]) => {
            const currentValue = options.enabledMunicipalities.includes(collection);
            if (currentValue) {
                municipalitiesSelected = true;
                const municipalityElem = document.createElement('div');
                municipalityElem.className = 'settings-item organization-item';

                const label = document.createElement('span');
                label.className = 'label';
                label.innerText = municipality;
                municipalityElem.appendChild(label);

                const deleteButton = document.createElement('img') as HTMLImageElement;
                deleteButton.className = 'clickable';
                deleteButton.src = browser.extension.getURL('images/close-small.svg');
                deleteButton.alt = 'Verwijder';
                deleteButton.addEventListener('click', () => {
                    addloadingOverlay(personalize);
                    getOptions().then(updatedOptions => {
                        const enabledMunicipalities = updatedOptions.enabledMunicipalities;
                        const index = enabledMunicipalities.indexOf(collection);
                        if (index !== -1) {
                            enabledMunicipalities.splice(index, 1);
                        }
                        saveOptions({ enabledMunicipalities });
                    });
                });
                municipalityElem.appendChild(deleteButton);

                personalize.appendChild(municipalityElem);
            } else {
                const provinceOption = document.createElement('option') as HTMLOptionElement;
                provinceOption.innerText = municipality;
                provinceOption.value = collection;

                municipalitySelect.appendChild(provinceOption);
            }
        });
        if (!municipalitiesSelected) {
            const noneSelected = document.createElement('p');
            noneSelected.className = 'no-entries';
            noneSelected.innerText = 'Geen gemeentes geselecteerd';
            personalize.appendChild(noneSelected);
        }
        personalize.appendChild(municipalitySelect);
    }
    container.appendChild(personalize);

    return container;
};

const resultsContent = (
    results: MediaObject[],
    keywords: string[],
    organizations: BasicOrganizations
): HTMLElement => {
    const container = document.createElement('div');
    container.className = 'content results';

    const listElem = document.createElement('ul');
    container.appendChild(listElem);

    const searchTermContainer = document.createElement('li');
    searchTermContainer.className = 'result';
    listElem.appendChild(searchTermContainer);

    const searchTermElem = document.createElement('div');
    searchTermElem.className = 'sidebar-item keywords';
    searchTermContainer.appendChild(searchTermElem);

    const searchTermHeading = document.createElement('h2');
    searchTermHeading.className = 'document-title';
    searchTermHeading.innerText = 'Gebruikte zoektermen';
    searchTermElem.appendChild(searchTermHeading);

    const searchTerms = document.createElement('p');
    searchTerms.className = 'info';
    searchTerms.innerText = keywords.join(', ');
    searchTermElem.appendChild(searchTerms);

    results.map(result => {
        let orgClass = '';
        let orgName = '';

        const match = result.index.match(/(ori|osi)_([a-z-]+)_\d+/);

        if (match) {
            if (match[1] === 'ori') {
                orgClass = 'municipality';
                orgName = organizations.municipalities[match[2]];
            } else {
                orgClass = 'province';
                orgName = organizations.provinces[match[2]];
            }
        }

        const itemElem = document.createElement('li');
        itemElem.className = `result ${orgClass}`;

        const linkElem = document.createElement('a') as HTMLAnchorElement;
        linkElem.className = 'sidebar-item';
        linkElem.href = result.url;
        linkElem.target = '_blank';
        itemElem.appendChild(linkElem);

        const locationElem = document.createElement('h3');
        locationElem.className = 'location colored';
        locationElem.innerText = orgName;
        linkElem.appendChild(locationElem);

        const titleElem = document.createElement('h2');
        titleElem.className = 'document-title';
        titleElem.innerText = result.name;
        linkElem.appendChild(titleElem);

        if (result.highlight.text) {
            result.highlight.text.forEach(highlight => {
                const elem = document.createElement('p');
                elem.className = 'highlight';
                elem.innerHTML = `...${highlight.trim()}...`;
                linkElem.appendChild(elem);
            });
        }

        listElem.appendChild(itemElem);
    });

    return container;
};
