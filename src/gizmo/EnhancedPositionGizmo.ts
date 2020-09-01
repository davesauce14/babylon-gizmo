import { AxisScaleGizmo, AbstractMesh, BoxBuilder, Scene, StandardMaterial, TransformNode, CylinderBuilder, Color3, Mesh, LinesMesh, Vector3, GizmoManager } from "babylonjs";
import * as BABYLON from "babylonjs";
import { EnhancedGizmo } from './EnhancedGizmo';


export class EnhancedPositionGizmo extends EnhancedGizmo {

    constructor(public scene: Scene) {
        super(scene);
    }

    create(){

        this.gizmoManager.positionGizmoEnabled = true;
        const gizmo = this.gizmoManager?.gizmos?.positionGizmo;

        if(gizmo && gizmo.xGizmo && gizmo.yGizmo && gizmo.zGizmo) {

            const thickness = 0.7;
            const colliderVisibility = 0;
    
            // Set Custom Mesh X
            const xMesh = this.createPositionMesh( this.utilityScene, Color3.Red(), thickness, "x", colliderVisibility );
            gizmo.xGizmo.setCustomMesh(xMesh);

            // // Set Custom Mesh Y
            const yMesh = this.createPositionMesh( this.utilityScene, Color3.Green(), thickness, "y", colliderVisibility );
            gizmo.yGizmo.setCustomMesh(yMesh);

            // Set Custom Mesh Z
            const zMesh = this.createPositionMesh( this.utilityScene, Color3.Blue(), thickness, "z", colliderVisibility )
            gizmo.zGizmo.setCustomMesh(zMesh);

            this.gizmoMouseObservers(this.utilityScene);
        }
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
    

}