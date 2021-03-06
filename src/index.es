/**
 * @typedef {*} TypeResource
 * @typedef {*} TypeResourceOptions
 * @typedef {function(TypeResourceOptions):TypeResource} TypeResourceOpener
 * @typedef {function(TypeResource)} TypeResourceCloser
 */
/**
 * Resource Manager
 */
export default class ResourceManager
{
	/**
	 * internal types
	 * @typedef {{open: TypeResourceOpener, close: TypeResourceCloser}} _TypeResourceOpenerCloser
	 * @typedef {function()} _TypeResourceCloserWrapper
	 */

	/**
	 * factory method
	 * @return {ResourceManager}
	 */
	static factory()
	{
		const objResourceManager = new ResourceManager();

		// register built-in resources
		return objResourceManager
			.register("array", _openArray, _closeArray)
			.register("map", _openMap, _closeMap)
			.register("set", _openSet, _closeSet);
	}

	/**
	 * constructor
	 */
	constructor()
	{
		/** @type {Map<string, _TypeResourceOpenerCloser>} */
		this._resourceFunctionsMap = new Map();
		/** @type {Map<string, TypeResource>} */
		this._resourceSingletonMap = new Map();
		/** @type {_TypeResourceCloserWrapper[]} */
		this._closeCallbacks = [];
		/** @type {boolean} */
		this._closed = false;
	}

	/**
	 * register resource
	 * @param {string} name
	 * @param {TypeResourceOpener} open
	 * @param {TypeResourceCloser} close
	 * @return {ResourceManager}
	 */
	register(name, open, close)
	{
		this._resourceFunctionsMap.set(name, {
			open: open,
			close: close,
		});
		return this;
	}

	/**
	 * open a resource
	 * @param {string} name
	 * @param {?TypeResourceOptions} options
	 * @return {TypeResource}
	 * @throws {Error}
	 */
	open(name, options = null)
	{
		if(this._closed)
		{
			_raise(`resources are already closed`);
		}

		const resourceFunctions = this._resourceFunctionsMap.get(name);
		if(resourceFunctions === undefined)
		{
			_raise(`resource name "${name}" is unregistered`);
		}

		const resource = resourceFunctions.open(options);
		this._closeCallbacks.push(() =>
		{
			resourceFunctions.close(resource);
		});

		return resource;
	}

	/**
	 * open a resource; singleton
	 * @param {string} name
	 * @param {?TypeResourceOptions} options
	 * @return {TypeResource}
	 * @throws {Error}
	 */
	openSingleton(name, options = null)
	{
		const key = JSON.stringify([name, options]);
		const objResource = this._resourceSingletonMap.get(key);
		if(objResource !== undefined)
		{
			return objResource;
		}

		const objResourceNew = this.open(name, options);
		this._resourceSingletonMap.set(key, objResourceNew);

		return objResourceNew;
	}

	/**
	 * close all resources
	 */
	close()
	{
		const callbacks = this._closeCallbacks;
		while(callbacks.length > 0)
		{
			// call in inverted order
			const callback = callbacks.pop();
			callback();
		}

		this._resourceFunctionsMap.clear();
		this._resourceSingletonMap.clear();
		this._closed = true;
	}
}

/**
 * throw an Error
 * @param {string} message
 * @throws {Error}
 */
function _raise(message)
{
	const err = new Error(message);
	err.name = "ResourceManagerError";
	throw err;
}

/**
 * open Array resource
 * @return {Array}
 */
function _openArray()
{
	return [];
}

/**
 * close Array resource
 * @param {Array} array
 */
function _closeArray(array)
{
	array.splice(0, array.length);
}

/**
 * open Map resource
 * @return {Map}
 */
function _openMap()
{
	return new Map();
}

/**
 * close Map resource
 * @param {Map} map
 */
function _closeMap(map)
{
	map.clear();
}

/**
 * open Set resource
 * @return {Set}
 */
function _openSet()
{
	return new Set();
}

/**
 * close
 * @param {Set} set
 */
function _closeSet(set)
{
	set.clear();
}
