import { AxisScaleGizmo, AbstractMesh, BoxBuilder, Scene, StandardMaterial, TransformNode, CylinderBuilder, Color3, Mesh, LinesMesh, Vector3, GizmoManager } from "babylonjs";
import { EnhancedGizmo } from './EnhancedGizmo';


export class EnhancedPositionGizmo extends EnhancedGizmo {

    constructor(public scene: Scene, private thickness = 0.7, private colliderVisibility = 0) {
        super(scene);
    }

    create(){

        this.gizmoManager.positionGizmoEnabled = true;
        const gizmo = this.gizmoManager?.gizmos?.positionGizmo;

        if(gizmo && gizmo.xGizmo && gizmo.yGizmo && gizmo.zGizmo) {
    
            // Set Custom Mesh X
            const xMesh = this.createPositionMesh(Color3.Red(), "x" );
            gizmo.xGizmo.setCustomMesh(xMesh);

            // // Set Custom Mesh Y
            const yMesh = this.createPositionMesh(Color3.Green(), "y" );
            gizmo.yGizmo.setCustomMesh(yMesh);

            // Set Custom Mesh Z
            const zMesh = this.createPositionMesh(Color3.Blue(), "z" )
            gizmo.zGizmo.setCustomMesh(zMesh);

            this.gizmoMouseObservers(this.utilityScene);
        }
    }

    createPositionMesh(color: Color3, axis: string): any {

        // Parent
        const arrow = new TransformNode("arrow", this.utilityScene);
    
        // Geometry
        const cylinder = CylinderBuilder.CreateCylinder("cylinder", { diameterTop: 0, height: 0.075, diameterBottom: 0.0375 * (1 + (this.thickness - 1) / 4), tessellation: 96 }, this.utilityScene);
        const cylinderBox = CylinderBuilder.CreateCylinder("ignore", { diameterTop: 0.1 * (1 + (this.thickness - 1) / 4), height: 0.1, diameterBottom: 0.1 * (1 + (this.thickness - 1) / 4), tessellation: 96 }, this.utilityScene);
        const line = CylinderBuilder.CreateCylinder("cylinder", { diameterTop: 0.005 * this.thickness, height: 0.275, diameterBottom: 0.005 * this.thickness, tessellation: 96 }, this.utilityScene);
        const lineBox = CylinderBuilder.CreateCylinder("ignore", { diameterTop: 0.07 * this.thickness, height: 0.275, diameterBottom: 0.07 * this.thickness, tessellation: 96 }, this.utilityScene);
    
        // Material
        const material = this.colorHelper(color, this.utilityScene);
        const hoverMaterial = this.colorHelper(Color3.Yellow(), this.utilityScene);
        const invisibleMaterial = this.colorHelper(Color3.Gray(), this.utilityScene);
        invisibleMaterial.alpha = this.colliderVisibility;
    
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