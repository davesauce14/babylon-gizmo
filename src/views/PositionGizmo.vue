<template>
  <v-container fluid class="big-iframe">
      <v-row class="mt-4" no-gutters>
        <v-col sm="12" lg="12"><h1 fluid>Position Gizmo</h1></v-col>
      </v-row>
    <v-row class="mb-6 big-iframe" no-gutters>
      <v-col sm="12" lg="6">
        <babylon-scene :gizmoSetup="gizmoSetup"></babylon-scene>
      </v-col>
      <v-col sm="12" lg="6">
        <babylon-scene :gizmoSetup="defaultGizmoSetup"></babylon-scene>
      </v-col>
    </v-row>
  </v-container>
</template>
<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import HelloWorld from "@/components/HelloWorld.vue"; // @ is an alias to /src
import BabylonScene from "./BabylonScene.vue";
import {
  UtilityLayerRenderer,
  Scene,
  StandardMaterial,
  TransformNode,
  CylinderBuilder,
  Color3,
  Mesh,
  LinesMesh,
  Vector3
} from "babylonjs";
import * as BABYLON from "babylonjs";

@Component({
  components: {
    BabylonScene
  }
})
export default class PositionGizmo extends Vue {
  meshMap: Map<Mesh, any> = new Map();
  dragging = false;

  defaultGizmoSetup(scene: Scene) {
    // Initialize GizmoManager
    const gizmoManager = new BABYLON.GizmoManager(scene);

    // Initialize all gizmos
    gizmoManager.positionGizmoEnabled = true;
    // gizmoManager.boundingBoxGizmoEnabled=true;
    // gizmoManager.rotationGizmoEnabled = true;
    // gizmoManager.scaleGizmoEnabled = true;
    // gizmoManager.gizmos.positionGizmo = new EnhancedPositionGizmo(util);
  }
  gizmoSetup(scene: Scene) {

    // Initialize GizmoManager
    const gizmoManager = new BABYLON.GizmoManager(scene);

    // Initialize all gizmos
    gizmoManager.positionGizmoEnabled = true;

    const utilityScene = gizmoManager.utilityLayer.utilityLayerScene;

    const thickness = 0.7;
    const colliderVisibility = 0;

    // Set Custom Mesh X
    const xColor = this.colorHelper(Color3.Red(), utilityScene);
    gizmoManager?.gizmos?.positionGizmo?.xGizmo?.setCustomMesh(this._CreateArrow(utilityScene, Color3.Red(), thickness, "x", colliderVisibility));

    // // Set Custom Mesh Y
    const yColor = this.colorHelper(Color3.Green(), utilityScene);
    gizmoManager?.gizmos?.positionGizmo?.yGizmo?.setCustomMesh(this._CreateArrow(utilityScene, Color3.Green(), thickness, "y", colliderVisibility));

    // Set Custom Mesh Z
    const zColor = this.colorHelper(Color3.Blue(), utilityScene);
    gizmoManager?.gizmos?.positionGizmo?.zGizmo?.setCustomMesh(this._CreateArrow(utilityScene, Color3.Blue(), thickness, "z", colliderVisibility));

    this.positionGizmoSyncLogic(utilityScene);

    console.log(this.meshMap);
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

        // const hoverMaterial = new StandardMaterial("", scene);
        // hoverMaterial.diffuseColor = color.add(new Color3(0.3, 0.3, 0.3));
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
        //arrow.lookAt(new Vector3(0,0,0).add(new Vector3(0,0,1)));

        if (axis === 'x') {
            arrow.rotation.y = Math.PI / 2;
            arrow.rotation.z = Math.PI / 2;
        } else if (axis === 'y') {
            // mesh.rotation.y = Math.PI / 2;
            arrow.rotation.x = Math.PI / 2 * -1;
        }

        const temp = {
          material,
          hoverMaterial,
          name: axis,
          active: false
        }
        this.meshMap.set(arrow as any, temp)
        // this.meshList.push(arrow as any);
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
