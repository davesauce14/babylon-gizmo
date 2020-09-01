<template>
  <v-container fluid class="big-iframe">
    <v-row class="mt-4" no-gutters>
      <v-col sm="12" lg="12">
        <h1 fluid>Scale Gizmo</h1>
      </v-col>
    </v-row>
    <v-row class="big-iframe" style="height: 60vh;" no-gutters>
      <v-col class="big-iframe" sm="12" lg="6">
        <babylon-scene sceneTitle="Enhanced" :gizmoSetup="gizmoSetup"></babylon-scene>
      </v-col>
      <v-col class="big-iframe" sm="12" lg="6">
        <babylon-scene sceneTitle="Default" :gizmoSetup="defaultGizmoSetup"></babylon-scene>
      </v-col>
    </v-row>
    <v-row no-gutters v-if="features.length">
      <v-col sm="12" lg="12">
        <h1 fluid class="ma-5">Features</h1>
        <v-card class="mx-auto" max-width="1000px" style="text-align: initial;" tile>

          <v-list-item three-line v-for="feature in features" :key="feature.name">
            <v-list-item-content>
              <v-list-item-title>{{ feature.name }}</v-list-item-title>
              <v-list-item-subtitle v-for="desc in feature.description.split('.')" :key="desc">{{desc}}</v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import HelloWorld from "@/components/HelloWorld.vue"; // @ is an alias to /src
import BabylonScene from "./BabylonScene.vue";
import { UtilityLayerRenderer, Scene, StandardMaterial, TransformNode, CylinderBuilder, Color3, Mesh, LinesMesh, Vector3 } from "babylonjs";
import * as BABYLON from "babylonjs";
import GizmoHelper from '../gizmo/GizmoHelper';
import { EnhancedScalingGizmo } from '../gizmo/EnhancedScalingGizmo'

@Component({
  components: {
    BabylonScene
  }
})
export default class ScaleGizmo extends Vue {

  // For UI
  features: any[] = [];

  // For Gizmo
  meshMap: Map<Mesh, any> = new Map();  // Node Caching for quick lookup
  dragging = false;


  mounted(){
      fetch('/scale.json')
        .then(res => res.json())
        .then(data => {
            this.features = data;
        })
  }

  defaultGizmoSetup(scene: Scene) {
    // Initialize GizmoManager
    const gizmoManager = new BABYLON.GizmoManager(scene);
    // Initialize all gizmos
    gizmoManager.scaleGizmoEnabled = true;
    this.registerKeyEvent(gizmoManager);
    
  }
  registerKeyEvent(gizmoManager: any) {
    // document
    //     .onkeydown = function(e) {
    //         if(e.key == 'a'){
    //             // Toggle planar
    //             gizmoManager.gizmos.positionGizmo.planarGizmoEnabled = !gizmoManager.gizmos.positionGizmo.planarGizmoEnabled;
    //         }
    //   }
  }
  gizmoSetup(scene: Scene) {

    const gizmo = new EnhancedScalingGizmo(scene);
    gizmo.create();
    
  }

  _CreateArrow(scene: Scene, color: Color3, thickness = 1, axis: string, colliderVisibility = 0): any {

    // Parent
    const arrow = new TransformNode("arrow", scene);

    // Geometry
    const cylinder = CylinderBuilder.CreateCylinder("cylinder", { diameterTop: 0, height: 0.075, diameterBottom: 0.0375 * (1 + (thickness - 1) / 4), tessellation: 96 }, scene);
    const cylinderBox = CylinderBuilder.CreateCylinder("ignore", { diameterTop: 0.1 * (1 + (thickness - 1) / 4), height: 0.1, diameterBottom: 0.1 * (1 + (thickness - 1) / 4), tessellation: 96 }, scene);
    const line = CylinderBuilder.CreateCylinder("cylinder", { diameterTop: 0.005 * thickness, height: 0.275, diameterBottom: 0.005 * thickness, tessellation: 96 }, scene);
    const lineBox = CylinderBuilder.CreateCylinder("ignore", { diameterTop: 0.07 * thickness, height: 0.275, diameterBottom: 0.07 * thickness, tessellation: 96 }, scene);

    // Material
    const material = this.colorHelper(color, scene);
    const hoverMaterial = this.colorHelper(Color3.Yellow(), scene);
    const invisibleMaterial = this.colorHelper(Color3.Gray(), scene);
    invisibleMaterial.alpha = colliderVisibility;

    // Position arrow pointing in its drag axis
    cylinder.material = material;
    cylinder.rotation.x = Math.PI / 2;
    cylinder.position.z += 0.3;
    cylinder.parent = arrow;

    line.material = material;
    line.position.z += 0.275 / 2;
    line.rotation.x = Math.PI / 2;
    line.parent = arrow;

    // For larger Bounding Border
    cylinderBox.rotation.x = Math.PI / 2;
    cylinderBox.position.z += 0.3;
    cylinderBox.material = invisibleMaterial;
    cylinderBox.parent = arrow;

    lineBox.material = invisibleMaterial;
    lineBox.position.z += 0.275 / 2;
    lineBox.rotation.x = Math.PI / 2;
    lineBox.parent = arrow;

    arrow.scaling.scaleInPlace(1 / 3);

    if (axis === "x") {
      arrow.rotation.y = Math.PI / 2;
      arrow.rotation.z = Math.PI / 2;
    } else if (axis === "y") {
      arrow.rotation.x = (Math.PI / 2) * -1;
    }

    const temp = {
      material,
      hoverMaterial,
      name: axis,
      active: false
    };
    this.meshMap.set(arrow as any, temp);
    return arrow;
  }

  colorHelper(color: Color3, scene: Scene) {
    // todo: add mats to array and destroy gracefully
    const mat = new StandardMaterial("", scene);
    mat.diffuseColor = color;
    mat.emissiveColor = color;
    mat.specularColor = color.subtract(new Color3(0.1, 0.1, 0.1));
    return mat;
  }

  positionGizmoSyncLogic (scene: Scene) {

      const nonHovered = this.colorHelper(Color3.Gray(), scene);
      nonHovered.alpha = .4;

      const _pointerObserver = scene.onPointerObservable.add((pointerInfo) => {
        if(pointerInfo.pickInfo) {

          // On Hover Logic
          if(pointerInfo.type === BABYLON.PointerEventTypes.POINTERMOVE) {

            if(this.dragging) return;
            this.meshMap.forEach((statusMap, parentMesh) => {

              const isHovered = pointerInfo.pickInfo && (parentMesh.getChildMeshes().indexOf((pointerInfo.pickInfo.pickedMesh as Mesh)) != -1);
              const material = isHovered || statusMap.active ? statusMap.hoverMaterial : statusMap.material;
              parentMesh.getChildMeshes().forEach((m) => {
                  if(m.name !== 'ignore') {
                      m.material = material;
                      if ((m as LinesMesh).color) {
                          (m as LinesMesh).color = material.diffuseColor;
                      }
                  }
              });
            })
          }

          // On Mouse Down
          if(pointerInfo.type === BABYLON.PointerEventTypes.POINTERDOWN) {

            // If user Clicked Gizmo
            if(this.meshMap.has(pointerInfo.pickInfo.pickedMesh?.parent as Mesh)) {
              this.dragging = true;
              const statusMap = this.meshMap.get(pointerInfo.pickInfo.pickedMesh?.parent as Mesh);
              statusMap.active = true;
              this.meshMap.forEach((statusMap, parentMesh) => {

                const isHovered = pointerInfo.pickInfo && (parentMesh.getChildMeshes().indexOf((pointerInfo.pickInfo.pickedMesh as Mesh)) != -1);
                const material = isHovered || statusMap.active ? statusMap.hoverMaterial : nonHovered;
                parentMesh.getChildMeshes().forEach((m) => {
                    if(m.name !== 'ignore') {
                        m.material = material;
                        if ((m as LinesMesh).color) {
                            (m as LinesMesh).color = material.diffuseColor;
                        }
                    }
                });
              })
            }
          }

          // On Mouse Down
          if(pointerInfo.type === BABYLON.PointerEventTypes.POINTERUP) {
            console.log(this.meshMap)
            this.meshMap.forEach((statusMap, parentMesh) => {
              statusMap.active = false;
              this.dragging = false;
              parentMesh.getChildMeshes().forEach((m) => {
                  if(m.name !== 'ignore') {
                      m.material = statusMap.material;
                      if ((m as LinesMesh).color) {
                          (m as LinesMesh).color = statusMap.material.diffuseColor;
                      }
                  }
              });
            })
          }
        }
      });
    }
}
</script>
