import { AxisScaleGizmo, AbstractMesh, BoxBuilder, Scene, StandardMaterial, TransformNode, CylinderBuilder, Color3, Mesh, LinesMesh, Vector3, GizmoManager } from "babylonjs";
import * as BABYLON from "babylonjs";

export class EnhancedGizmo {

    // Babylon Properties
    public gizmoManager: GizmoManager;
    public utilityScene: Scene;

    // Gizmo Instance State Properties
    public meshMap: Map<Mesh, any> = new Map();  // Node Caching for quick lookup
    public dragging = false;

    constructor(public scene: Scene) {

        this.gizmoManager = new BABYLON.GizmoManager(this.scene);
        this.utilityScene = this.gizmoManager.utilityLayer.utilityLayerScene;

    }

    colorHelper(color: Color3, scene: Scene) {
        // todo: add mats to array and destroy gracefully
        const mat = new StandardMaterial("", scene);
        mat.diffuseColor = color;
        mat.emissiveColor = color;
        mat.specularColor = color.subtract(new Color3(0.1, 0.1, 0.1));
        return mat;
    }

    gizmoMouseObservers (scene: Scene) {

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