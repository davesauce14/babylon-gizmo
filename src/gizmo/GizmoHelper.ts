import { AxisScaleGizmo, AbstractMesh, BoxBuilder, Scene, StandardMaterial, TransformNode, CylinderBuilder, Color3, Mesh, LinesMesh, Vector3, GizmoManager } from "babylonjs";
import * as BABYLON from "babylonjs";


export default class GizmoHelper {

    // Babylon Properties
    private gizmoManager: GizmoManager;
    private utilityScene: Scene;

    // Gizmo Instance State Properties
    private meshMap: Map<Mesh, any> = new Map();  // Node Caching for quick lookup
    private dragging = false;

    constructor(private scene: Scene) {

        this.gizmoManager = new BABYLON.GizmoManager(this.scene);
        this.utilityScene = this.gizmoManager.utilityLayer.utilityLayerScene;

    }

    enhancedScaleGizmo(){

        this.gizmoManager.scaleGizmoEnabled = true;
        const gizmo = this.gizmoManager?.gizmos?.scaleGizmo;

        if(gizmo && gizmo.xGizmo && gizmo.yGizmo && gizmo.zGizmo) {

            const thickness = 0.7;
            const colliderVisibility = 0;
    
            this.gizmoManager.scaleGizmoEnabled = true;
    
            const xMesh = this.createScaleGizmo(gizmo.xGizmo, this.utilityScene, Color3.Red(), thickness, "x", colliderVisibility);
            gizmo.xGizmo.setCustomMesh(xMesh);
    
            // Set Custom Mesh Y
            const yMesh = this.createScaleGizmo(gizmo.yGizmo, this.utilityScene, Color3.Green(), thickness, "y", colliderVisibility);
            gizmo.yGizmo.setCustomMesh(yMesh);
            gizmo.yGizmo.sensitivity = 50;
    
            // Set Custom Mesh Z
            const zMesh = this.createScaleGizmo(gizmo.zGizmo, this.utilityScene, Color3.Blue(), thickness, "z", colliderVisibility);
            gizmo.zGizmo.setCustomMesh(zMesh);

            const universalMesh = this.createUniversalScaleGizmo(gizmo.uniformScaleGizmo, this.utilityScene, Color3.Gray(), thickness, "u", colliderVisibility);
            gizmo.uniformScaleGizmo.setCustomMesh(universalMesh);
            gizmo.uniformScaleGizmo.sensitivity = 5;

            this.positionGizmoSyncLogic(this.utilityScene);
        }
    }


    createScaleGizmo(gizmo: AxisScaleGizmo, scene: Scene, color: Color3, thickness = 1, axis: string, colliderVisibility: number): any {

        // Build mesh on root node
        const parentMesh = new AbstractMesh("", scene);

        // Create Material
        const material = this.colorHelper(color, scene);
        const hoverMaterial = this.colorHelper(Color3.Yellow(), scene);
        const invisibleMaterial = this.colorHelper(Color3.Gray(), scene);
        invisibleMaterial.alpha = colliderVisibility;

        // Create Mesh
        const { nodeMesh, lineMesh } = this.createScaleMesh(parentMesh, material, thickness, scene);
        // Create Collider
        this.createScaleMesh(parentMesh, invisibleMaterial, thickness, scene, 2, true);

        // Conditionally position gizmo mesh based on axis
        if(axis === 'x') {
            parentMesh.rotation.y = (Math.PI / 2);
        } else if(axis === 'y') {
            parentMesh.rotation.x = (Math.PI / 2) * -1;
        } else if(axis === 'z') {
            // Default Rotation
        }

        parentMesh.scaling.scaleInPlace(1 / 3);

        // Closure of inital prop values for resetting
        const nodePosition = nodeMesh.position.clone();
        const linePosition = lineMesh.position.clone();
        const lineScale = lineMesh.scaling.clone();

        const increaseGizmoMesh = (size: number) => {
            nodeMesh.position.z += size / 3;
            lineMesh.scaling.y += size * 1.2;
            lineMesh.position.z = nodeMesh.position.z / 2;
        }

        const resetGizmoMesh = () => {
            nodeMesh.position = new BABYLON.Vector3(nodePosition.x, nodePosition.y, nodePosition.z);
            lineMesh.position = new BABYLON.Vector3(linePosition.x, linePosition.y, linePosition.z);
            lineMesh.scaling = new BABYLON.Vector3(lineScale.x, lineScale.y, lineScale.z);
        }

        // On Drag Listener: to move gizmo mesh with user action
        const destroyThis = gizmo.dragBehavior.onDragObservable.add(e => increaseGizmoMesh((e.delta as any)[axis]))

        // On Drag End Listener: to reset the gizmo to original state
        const destroyThisToo = gizmo.dragBehavior.onDragEndObservable.add(resetGizmoMesh)

        const andThis = document.addEventListener('universalGizmoDrag', e => increaseGizmoMesh((e as any).detail))

        const andAlsoThis = document.addEventListener('universalGizmoEnd', resetGizmoMesh)


        const temp = {
            material,
            hoverMaterial,
            name: axis,
            active: false
        };
        this.meshMap.set(parentMesh as any, temp);

        return parentMesh;
    }

    createScaleMesh(parentMesh: AbstractMesh, coloredMaterial: StandardMaterial, thickness: number, scene: Scene, scale = 1, isCollider = false): any {

        const colliderScaler = (scale === 1) ? 1 : 10;
        const nodeMesh = BoxBuilder.CreateBox(
            isCollider ? 'ignore' : "yPosMesh", 
            { size: 0.4 * (1 + (thickness - 1) / 4) * scale }, 
            scene
        );
        const lineMesh = CylinderBuilder.CreateCylinder(
            isCollider ? 'ignore' : "cylinder", 
            { diameterTop: 0.005 * thickness * (scale * colliderScaler), height: 0.275, diameterBottom: 0.005 * thickness * (scale * (colliderScaler / 2)), tessellation: 96 }, 
            scene
        );
        lineMesh.material = coloredMaterial;
        parentMesh.addChild(nodeMesh);
        parentMesh.addChild(lineMesh);

        // Position arrow pointing in its drag axis
        nodeMesh.scaling.scaleInPlace(0.1);
        nodeMesh.material = coloredMaterial;
        nodeMesh.rotation.x = Math.PI / 2;
        nodeMesh.position.z += 0.3;
        lineMesh.position.z += 0.275 / 2;
        lineMesh.rotation.x = Math.PI / 2;

        return { nodeMesh, lineMesh };

    }


    createUniversalScaleGizmo(gizmo: AxisScaleGizmo, scene: Scene, color: Color3, thickness = 1, axis: string, colliderVisibility: number): any {

        // Build mesh on root node
        const parentMesh = new AbstractMesh("", scene);

        // Create Material
        const material = this.colorHelper(color, scene);
        const hoverMaterial = this.colorHelper(Color3.Yellow(), scene);
        const invisibleMaterial = this.colorHelper(Color3.Gray(), scene);
        invisibleMaterial.alpha = colliderVisibility;

        // Create Mesh
        const { nodeMesh, lineMesh } = this.createUniversalScaleMesh(parentMesh, material, thickness, scene);
        // Create Collider
        this.createUniversalScaleMesh(parentMesh, invisibleMaterial, thickness, scene, 2, true);

        parentMesh.scaling.scaleInPlace(1 / 3);

        // Drag Event Listener
        gizmo.dragBehavior.onDragObservable.add(e => {
            document.dispatchEvent(new CustomEvent('universalGizmoDrag' , {
                detail: e.delta.y
            }));
        })

        // Drag Event Listener
        gizmo.dragBehavior.onDragEndObservable.add(e => {
            document.dispatchEvent(new CustomEvent('universalGizmoEnd'));
        })

        const temp = {
            material,
            hoverMaterial,
            name: axis,
            active: false
        };
        this.meshMap.set(parentMesh as any, temp);

        return parentMesh;
    }

    createUniversalScaleMesh(parentMesh: AbstractMesh, coloredMaterial: StandardMaterial, thickness: number, scene: Scene, scale = 1, isCollider = false): any {

        const colliderScaler = (scale === 1) ? 1 : 10;
        const nodeMesh = BoxBuilder.CreateBox(
            isCollider ? 'ignore' : "yPosMesh", 
            { size: 0.4 * (1 + (thickness - 1) / 4) * scale }, 
            scene
        );
        parentMesh.addChild(nodeMesh);

        // Position arrow pointing in its drag axis
        nodeMesh.scaling.scaleInPlace(0.1);
        nodeMesh.material = coloredMaterial;
        nodeMesh.rotation.x = Math.PI / 2;
        nodeMesh.position.z += 0;

        return { nodeMesh };

    }

    createPositionMesh(scene: Scene, color: Color3, thickness = 1, axis: string, colliderVisibility = 0): any {

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