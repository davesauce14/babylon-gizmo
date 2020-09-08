import { AxisScaleGizmo, AbstractMesh, BoxBuilder, Scene, StandardMaterial, CylinderBuilder, Color3 } from "babylonjs";
import * as BABYLON from "babylonjs";
import { EnhancedGizmo } from './EnhancedGizmo';


export class EnhancedScalingGizmo extends EnhancedGizmo {

    eventListeners: any[] = [];

    constructor(public scene: Scene) {
        super(scene);
    }

    create(){

        this.gizmoManager.scaleGizmoEnabled = true;
        const gizmo = this.gizmoManager?.gizmos?.scaleGizmo;

        if(gizmo && gizmo.xGizmo && gizmo.yGizmo && gizmo.zGizmo) {

            const thickness = 1;
            const colliderVisibility = 0;
    
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
            gizmo.uniformScaleGizmo.sensitivity = 10;

            this.gizmoMouseObservers(this.utilityScene);
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
        const sub1 = gizmo.dragBehavior.onDragObservable.add(e => increaseGizmoMesh((e.delta as any)[axis]))

        // On Drag End Listener: to reset the gizmo to original state
        const sub2 = gizmo.dragBehavior.onDragEndObservable.add(resetGizmoMesh)

        const sub3 = document.addEventListener('universalGizmoDrag', e => increaseGizmoMesh((e as any).detail))

        const sub4 = document.addEventListener('universalGizmoEnd', resetGizmoMesh)


        const temp = {
            material,
            hoverMaterial,
            name: axis,
            active: false
        };
        this.meshMap.set(parentMesh as any, temp);

        // Add Mesh / Mat / Observables to global for destroy
        this.materials = [...this.materials, material, hoverMaterial, invisibleMaterial];
        this.meshes = [...this.meshes, parentMesh];
        // this.observables = [sub1, sub2, sub3, sub4];
        this.eventListeners = [
            {
                listener: 'universalGizmoDrag',
                fn: increaseGizmoMesh
            },
            {
                listener: 'universalGizmoEnd',
                fn: resetGizmoMesh
            }
        ];

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
            { diameterTop: 0.005 * thickness * (scale * colliderScaler), height: 0.275, diameterBottom: 0.005 * thickness * (scale), tessellation: 96 }, 
            // { diameterTop: 0.005 * thickness * (scale * colliderScaler), height: 0.275, diameterBottom: 0.005 * thickness * (scale * (colliderScaler / 2)), tessellation: 96 }, 
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

        // Add Mesh / Mat / Observables to global for destroy
        this.materials = [...this.materials, material, hoverMaterial, invisibleMaterial];
        this.meshes = [...this.meshes, parentMesh];

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

    destroy(){
        this.eventListeners.forEach(e => {
            document.addEventListener(e.listener, e.fn, false);
        });
        super.destroy();
    }

}