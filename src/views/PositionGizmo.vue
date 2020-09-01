<template>
  <v-container fluid class="big-iframe">
    <v-row class="mt-4" no-gutters>
      <v-col sm="12" lg="12">
        <h1 fluid>Position Gizmo</h1>
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
import { EnhancedPositionGizmo } from "../gizmo/EnhancedPositionGizmo";

@Component({
  components: {
    BabylonScene
  }
})
export default class PositionGizmo extends Vue {

  // For UI
  features: any[] = [];

  // For Gizmo
  meshMap: Map<Mesh, any> = new Map();  // Node Caching for quick lookup
  dragging = false;


  mounted(){
      fetch('/position.json')
        .then(res => res.json())
        .then(data => {
            console.log('position data', data);
            this.features = data;
        })
  }

  defaultGizmoSetup(scene: Scene) {
    // Initialize GizmoManager
    const gizmoManager = new BABYLON.GizmoManager(scene);
    // Initialize all gizmos
    gizmoManager.positionGizmoEnabled = true;
    this.registerKeyEvent(gizmoManager);
    
  }
  registerKeyEvent(gizmoManager: any) {
    document
        .onkeydown = function(e) {
            if(e.key == 'a'){
                // Toggle planar
                gizmoManager.gizmos.positionGizmo.planarGizmoEnabled = !gizmoManager.gizmos.positionGizmo.planarGizmoEnabled;
            }
      }
  }
  gizmoSetup(scene: Scene) {
    const gizmo = new EnhancedPositionGizmo(scene);
    gizmo.create();
  }

}
</script>
