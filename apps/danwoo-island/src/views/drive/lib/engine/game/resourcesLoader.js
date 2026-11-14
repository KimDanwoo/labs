import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js'
import * as THREE from 'three/webgpu'
import { Game } from './game'

export class ResourcesLoader
{
    constructor()
    {
        this.game = Game.getInstance()
        this.loaders = new Map()
        this.cache = new Map()
    }

    getLoader(_type)
    {
        if(this.loaders.has(_type))
            return this.loaders.get(_type)

        let loader = null

        if(_type === 'texture')
        {
            loader = new THREE.TextureLoader()
        }
        else if(_type === 'textureKtx')
        {
            loader = new KTX2Loader()
            loader.setTranscoderPath('./basis/')
            loader.detectSupport(this.game.rendering.renderer)
        }
        else if(_type === 'draco')
        {
            loader = new DRACOLoader()
            loader.setDecoderPath('./draco/')
            loader.preload()
        }
        else if(_type === 'gltf')
        {
            const dracoLoader = this.getLoader('draco')

            const ktx2Loader = this.getLoader('textureKtx')

            loader = new GLTFLoader()
            loader.setDRACOLoader(dracoLoader)
            loader.setKTX2Loader(ktx2Loader)
        }

        this.loaders.set(_type, loader)

        return loader
    }

    load(_files, _progressCallback = null)
    {
        return new Promise((resolve, reject) =>
        {
            let toLoad = _files.length
            const loadedResources = {}

            const progress = () =>
            {
                toLoad--

                if(typeof _progressCallback === 'function')
                    _progressCallback(toLoad, _files.length)

                if(toLoad === 0)
                    resolve(loadedResources)
            }

            const save = (_file, _resource) =>
            {
                if(typeof _file[3] !== 'undefined')
                    _file[3](_resource)

                loadedResources[_file[0]] = _resource

                this.cache.set(_file[1], _resource)
            }

            const error = (_file) =>
            {
                console.log(`Resources > Couldn't load file ${_file[1]}`)
                reject(_file[1])
            }

            for(const _file of _files)
            {
                if(this.cache.has(_file[1]))
                {
                    loadedResources[_file[0]] = this.cache.get(_file[1])

                    progress()
                }

                else
                {
                    const loader = this.getLoader(_file[2])
                    loader.load(
                        _file[1],
                        resource => {
                            save(_file, resource)
                            progress()
                        },
                        undefined,
                        error
                    )
                }
            }
        })
    }
}