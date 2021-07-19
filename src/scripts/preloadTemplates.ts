import { SUMMONER_MODULE_NAME } from './settings';

export const preloadTemplates = async function () {
	const templatePaths = [
		// Add paths to "module/XXX/templates"
		//`/modules/${MODULE_NAME}/templates/XXX.html`,
		`/modules/${SUMMONER_MODULE_NAME}/templates/choose_polymorph.html`,
	];

	return loadTemplates(templatePaths);
}
