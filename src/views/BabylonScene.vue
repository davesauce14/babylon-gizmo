<template>
    <v-container fluid class="big-iframe">
      <v-row class="mb-6 big-iframe" no-gutters>
        <v-col class="big-iframe" sm="12" lg="12">
          <canvas id="renderCanvas" ref="canvasEle" ></canvas>
          <h1 class="scene-label">{{ sceneTitle }}</h1>
        </v-col>
      </v-row>
    </v-container>
</template>

<script lang="ts">
import { Component, Vue, Prop, Ref } from 'vue-property-decorator';
import {  UtilityLayerRenderer, Scene, StandardMaterial, TransformNode, CylinderBuilder, Color3, Mesh, LinesMesh, Vector3 }from 'babylonjs'
import * as BABYLON from 'babylonjs';

@Component({})
export default class BabylonScene extends Vue {

    @Prop() gizmoSetup: any;    // GizmoSetup API
    @Prop() sceneTitle: any;    // Title
    @Ref() canvasEle: any;

    mounted() {
        this.createScene();
    }

    createScene() {
        // Create scene
        //const canvas: any =  document.getElementById("renderCanvas");
        // console.log(this.canvasEle, canvas);
        const engine = new BABYLON.Engine( this.canvasEle);
        const scene = new BABYLON.Scene(engine);
        const camera = new BABYLON.ArcRotateCamera("Camera", -Math.PI / 4, Math.PI / 2.5, 10, BABYLON.Vector3.Zero(), scene);
        camera.attachControl(this.canvasEle, true);
        camera.minZ = 0.1;

        // Attach Gizmos CallBack
        this.gizmoSetup(scene);

        // Create objects
        const hdrTexture = BABYLON.CubeTexture.CreateFromPrefilteredData("https://playground.babylonjs.com/textures/environment.dds", scene);
        const hdrSkybox = BABYLON.Mesh.CreateBox("hdrSkyBox", 1000.0, scene);
        hdrSkybox.isPickable = false;
        const hdrSkyboxMaterial = new BABYLON.PBRMaterial("skyBox", scene);
        hdrSkyboxMaterial.backFaceCulling = false;
        hdrSkyboxMaterial.reflectionTexture = hdrTexture.clone();
        hdrSkyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
        hdrSkyboxMaterial.microSurface = 1.0;
        hdrSkyboxMaterial.disableLighting = true;
        hdrSkybox.material = hdrSkyboxMaterial;
        hdrSkybox.infiniteDistance = true;
        const sphereGlass = BABYLON.Mesh.CreateSphere("sphereGlass", 48, 1.0, scene);
        sphereGlass.translate(new BABYLON.Vector3(1, 0, 0), -3);
        const sphereMetal = BABYLON.Mesh.CreateSphere("sphereMetal", 48, 1.0, scene);
        sphereMetal.translate(new BABYLON.Vector3(1, 0, 0), 3);
        const spherePlastic = BABYLON.Mesh.CreateSphere("spherePlastic", 48, 1.0, scene);
        spherePlastic.translate(new BABYLON.Vector3(0, 0, 1), -3);
        const woodPlank = BABYLON.MeshBuilder.CreateBox("plane", { width: 3, height: 0.1, depth: 3 }, scene);
        const glass = new BABYLON.PBRMaterial("glass", scene);
        glass.reflectionTexture = hdrTexture;
        glass.refractionTexture = hdrTexture;
        glass.linkRefractionWithTransparency = true;
        glass.indexOfRefraction = 0.52;
        glass.alpha = 0;
        glass.microSurface = 1;
        glass.reflectivityColor = new BABYLON.Color3(0.2, 0.2, 0.2);
        glass.albedoColor = new BABYLON.Color3(0.85, 0.85, 0.85);
        sphereGlass.material = glass;
        const metal = new BABYLON.PBRMaterial("metal", scene);
        metal.reflectionTexture = hdrTexture;
        metal.microSurface = 0.96;
        metal.reflectivityColor = new BABYLON.Color3(0.85, 0.85, 0.85);
        metal.albedoColor = new BABYLON.Color3(0.01, 0.01, 0.01);
        sphereMetal.material = metal;
        const plastic = new BABYLON.PBRMaterial("plastic", scene);
        plastic.reflectionTexture = hdrTexture;
        plastic.microSurface = 0.96;
        plastic.albedoColor = new BABYLON.Color3(0.206, 0.94, 1);
        plastic.reflectivityColor = new BABYLON.Color3(0.003, 0.003, 0.003);
        spherePlastic.material = plastic;
        const wood = new BABYLON.PBRMaterial("wood", scene);
        wood.reflectionTexture = hdrTexture;
        wood.environmentIntensity = 1;
        wood.specularIntensity = 0.3;
        wood.reflectivityTexture = new BABYLON.Texture("https://playground.babylonjs.com/textures/reflectivity.png", scene);
        wood.useMicroSurfaceFromReflectivityMapAlpha = true;
        wood.albedoColor = BABYLON.Color3.White();
        wood.albedoTexture = new BABYLON.Texture("https://playground.babylonjs.com/textures/albedo.png", scene);
        woodPlank.material = wood;

        engine.runRenderLoop(function() {
            scene.render();
        });

        return scene;
    }
}
</script>
