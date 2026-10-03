import trimesh, math, os
from trimesh.transformations import rotation_matrix

scene = trimesh.Scene()

def mat(name, color, metal=0.0, rough=.45, emit=None):
    kw = dict(name=name, baseColorFactor=(*color,1.0), metallicFactor=metal, roughnessFactor=rough)
    if emit:
        kw.update(emissiveFactor=emit, emissiveStrength=4.0)
    return trimesh.visual.material.PBRMaterial(**kw)

black=mat("Tactical Black",(0.018,.025,.040),.78,.25)
black2=mat("Fabric Black",(.035,.045,.065),.12,.58)
white=mat("Coat White",(.72,.76,.82),.48,.30)
silver=mat("Armor Silver",(.36,.43,.52),.92,.18)
silver2=mat("Armor Edge",(.65,.70,.78),.96,.13)
blue=mat("Electric Blue",(.01,.10,.30),.52,.20,(.01,.55,1.0))
blue2=mat("Energy Core",(.02,.22,.55),.30,.14,(.02,.8,1.0))
skin=mat("Skin",(.64,.38,.27),0,.43)
lip=mat("Lip",(.34,.12,.11),0,.38)
hair=mat("Hair",(.006,.009,.016),.60,.18)

def add(g,name,material,pos=(0,0,0),rot=None,scale=None):
    g.visual.material=material
    g.metadata["name"]=name
    if scale is not None: g.apply_scale(scale)
    if rot is not None: g.apply_transform(rotation_matrix(rot[0],rot[1]))
    g.apply_translation(pos)
    scene.add_geometry(g,node_name=name,geom_name=name)

def box(name,size,pos,material,rot=None,scale=None):
    add(trimesh.creation.box(size),name,material,pos,rot,scale)

def cyl(name,r,h,pos,material,sections=32,rot=None):
    add(trimesh.creation.cylinder(r,h,sections=sections),name,material,pos,rot)

def sphere(name,r,pos,material,scale=(1,1,1)):
    add(trimesh.creation.icosphere(subdivisions=3,radius=r),name,material,pos,scale=scale)

def cone(name,r,h,pos,material,rot=None,sections=24):
    add(trimesh.creation.cone(r,h,sections=sections),name,material,pos,rot)

def ring(name,r1,r2,h,pos,material):
    add(trimesh.creation.annulus(r1,r2,h,sections=32),name,material,pos)

# boots: layered soles, toe armor, ankle guards, vents and energy strips
for side,x in [("L",-0.23),("R",0.23)]:
    box("BootBase_"+side,(.42,.58,.20),(x,.10,-.10),black)
    box("BootSole_"+side,(.46,.62,.09),(x,.04,-.23),silver2)
    box("BootEnergySole_"+side,(.39,.52,.035),(x,.02,-.285),blue2)
    box("BootUpper_"+side,(.37,.42,.38),(x,.28,.02),black2)
    box("BootAnkleArmor_"+side,(.40,.16,.32),(x,.50,.08),silver)
    box("BootTongue_"+side,(.18,.06,.30),(x,.52,.02),blue)
    for i in range(5):
        box("BootLace_"+side+str(i),(.26,.025,.035),(x,.18+i*.075,.22),silver2)
    for i in range(4):
        box("BootVent_"+side+str(i),(.035,.10,.025),(x-.14+i*.09,-.01,-.285),blue)
    box("BootHeel_"+side,(.38,.12,.30),(x,-.05,.02),black)

# legs: athletic taper, layered cargo pants, knees and straps
for side,x in [("L",-0.22),("R",0.22)]:
    cyl("Calf_"+side,.15,.62,(x,.72,0),black2)
    box("ShinPlate_"+side,(.28,.43,.08),(x,.72,-.17),silver)
    box("ShinGlow_"+side,(.08,.34,.035),(x,.72,-.22),blue)
    sphere("Knee_"+side,.18,(x,1.05,-.01),silver,(1,.75,.55))
    cyl("Thigh_"+side,.19,.70,(x,1.35,0),black2)
    box("ThighOuterArmor_"+side,(.10,.48,.10),(x+(.16 if side=="R" else -.16),1.35,-.02),silver)
    box("Cargo_"+side,(.22,.32,.20),(x+(.15 if side=="R" else -.15),1.28,-.08),black)
    for j in range(3):
        box("CargoStrap_"+side+str(j),(.27,.035,.06),(x,1.14+j*.12,-.20),silver2)

# pelvis and utility system
box("PelvisCore",(.72,.34,.46),(0,1.70,0),black)
box("WaistArmor",(.80,.18,.48),(0,1.82,-.02),silver)
box("BeltLeather",(.86,.09,.50),(0,1.86,-.04),black2)
box("BeltEdge",(.86,.035,.50),(0,1.91,-.06),blue)
box("BuckleOuter",(.20,.16,.08),(0,1.88,-.27),silver2)
box("BuckleCore",(.10,.08,.04),(0,1.88,-.315),blue2)
for side,x in [("L",-0.36),("R",0.36)]:
    box("UtilityPouch_"+side,(.20,.28,.25),(x,1.69,-.05),black)
    box("UtilityPouchTop_"+side,(.22,.06,.26),(x,1.84,-.06),silver)
    box("PouchGlow_"+side,(.08,.04,.18),(x,1.70,-.19),blue)

# torso with layered chest armor, ribs, core
box("TorsoBase",(.78,.86,.44),(0,2.18,0),black2)
box("ChestArmor",(.66,.48,.12),(0,2.30,-.23),silver)
box("ChestWhitePanel",(.52,.52,.045),(0,2.28,-.305),white)
box("ChestCenterArmor",(.24,.32,.10),(0,2.28,-.35),silver2)
box("ChestCore",(.13,.20,.06),(0,2.29,-.415),blue2)
for side,x in [("L",-0.25),("R",0.25)]:
    for i in range(3):
        box("RibArmor_"+side+str(i),(.17,.07,.045),(x,2.13+i*.11,-.245),silver)
        box("RibGlow_"+side+str(i),(.08,.018,.025),(x,2.13+i*.11,-.285),blue)

# long coat: multiple layers, hems, seams and blue inner lining
for side,x in [("L",-0.38),("R",0.38)]:
    box("CoatOuter_"+side,(.30,1.10,.10),(x,1.86,.02),white)
    box("CoatInner_"+side,(.24,1.02,.045),(x,1.87,-.07),black)
    box("CoatBlueLining_"+side,(.12,.92,.035),(x,1.84,-.125),blue)
    for i in range(6):
        box("CoatFold_"+side+str(i),(.035,.72,.025),(x+(-.11+i*.044),1.88,-.16),white)
    box("CoatHem_"+side,(.34,.07,.12),(x,1.32,.01),silver2)
    box("CoatBlueHem_"+side,(.25,.035,.04),(x,1.30,-.07),blue2)
for x in [-.30,.30]:
    box("CoatShoulderStrap",(.07,1.15,.05),(x,2.15,-.27),silver)
    box("CoatShoulderGlow",(.025,1.05,.025),(x,2.15,-.30),blue)

# neck and detailed face
cyl("Neck",.145,.22,(0,2.67,0),skin)
sphere("HeadMain",.305,(0,3.00,0),skin,(.95,1.08,.92))
sphere("Jawline",.25,(0,2.86,-.015),skin,(1.0,.72,.88))
for x in [-.105,.105]:
    sphere("Ear",.055,(x,3.00,.02),skin,(.65,1,.55))
    sphere("EyeSocket",.075,(x,3.055,-.265),skin,(1,.65,.45))
    sphere("EyeIris",.032,(x,3.055,-.315),blue2,(1,.6,.4))
    box("Eyebrow",(.13,.025,.035),(x,3.145,-.285),hair,rot=(.18,(0,0,1)))
sphere("NoseBridge",.035,(0,3.02,-.285),skin,(1.0,1.7,.7))
sphere("NoseTip",.045,(0,2.98,-.31),skin,(1.2,.75,.65))
box("UpperLip",(.11,.025,.035),(0,2.86,-.255),lip)
box("LowerLip",(.13,.025,.04),(0,2.835,-.25),lip)
box("Chin",(.12,.04,.04),(0,2.78,-.245),skin)
# neck collar
box("NeckGuard",(.40,.18,.38),(0,2.72,.02),black)
box("NeckBlueEdge",(.30,.035,.39),(0,2.76,-.19),blue)

# hair cap + 40 directional strands for silhouette
sphere("HairCap",.32,(0,3.17,.02),hair,(1.02,.82,1.0))
for i in range(40):
    a=2*math.pi*i/40
    x=.27*math.cos(a)
    z=.23*math.sin(a)
    y=3.25+.045*math.cos(a*3)
    cone("HairStrand_%02d"%i,.045,.38,(x,y,z),hair,sections=20)
for i in range(11):
    x=(i-5)*.055
    cone("FrontBang_%02d"%i,.05,.34,(x,3.10,-.25),hair,sections=20)

# shoulders, arms, elbows, gauntlets, fingers
for side,x in [("L",-0.55),("R",0.55)]:
    sphere("ShoulderBase_"+side,.20,(x,2.48,0),black2)
    sphere("ShoulderArmor_"+side,.23,(x,2.51,-.02),silver,(1,.82,.72))
    sphere("ShoulderCore_"+side,.075,(x,2.51,-.18),blue2)
    for j in range(4):
        box("ShoulderPlate_"+side+str(j),(.16,.18,.07),(x+(-.10+j*.065 if side=="L" else .10-j*.065),2.59,-.08),silver2)
    cyl("UpperArm_"+side,.125,.50,(x,2.18,0),black2)
    box("UpperArmArmor_"+side,(.27,.28,.12),(x,2.18,-.08),silver)
    cyl("Forearm_"+side,.14,.48,(x,1.82,-.01),black2)
    box("ForearmArmor_"+side,(.30,.34,.15),(x,1.82,-.09),silver)
    box("ForearmEnergy_"+side,(.08,.27,.035),(x,1.82,-.18),blue2)
    sphere("Hand_"+side,.135,(x,1.53,-.03),skin,(1,.9,.8))
    box("GlovePalm_"+side,(.25,.20,.10),(x,1.55,-.11),black)
    for j in range(5):
        xx=x-.10+j*.05
        box("GloveFinger_"+side+str(j),(.042,.17,.075),(xx,1.45,-.13),black)
        box("Knuckle_"+side+str(j),(.048,.045,.045),(xx,1.51,-.17),silver2)
    box("GlovePlate_"+side,(.24,.10,.07),(x,1.62,-.16),blue2)
    sphere("Elbow_"+side,.10,(x,1.98,-.02),silver)

# back module and luminous spine
box("BackpackCore",(.52,.76,.22),(0,2.25,.30),black)
box("BackShell",(.62,.62,.08),(0,2.28,.43),silver)
box("BackEmblem",(.30,.34,.05),(0,2.29,.49),blue2)
for i in range(7):
    box("SpineLight_%02d"%i,(.045,.09,.035),(0,1.92+i*.11,.50),blue2)

# sword: guard, wrapped grip, sheath, layered blade, energy channel
box("SwordSheath",(.13,1.65,.10),(.50,2.35,.40),black,rot=(-.16,(0,0,1)))
box("SwordGrip",(.11,.55,.11),(.50,2.14,.38),blue)
for i in range(8):
    box("SwordWrap_%02d"%i,(.14,.035,.15),(.50,1.91+i*.065,.36),silver2,rot=(.65,(0,0,1)))
box("SwordGuard",(.38,.09,.12),(.50,2.47,.38),silver2)
box("SwordGuardCore",(.20,.04,.05),(.50,2.47,.35),blue2)
box("SwordBlade",(.14,1.28,.065),(.50,3.10,.38),silver2)
box("SwordEdgeGlow",(.035,1.18,.025),(.50,3.10,.34),blue2)
box("SwordTip",(.14,.18,.065),(.50,3.78,.38),silver2)

# straps, chains and 3D energy nodes
for side,x in [("L",-0.34),("R",0.34)]:
    for j in range(4):
        box("Harness_"+side+str(j),(.06,.35,.05),(x,2.05-j*.16,-.30),silver)
for i in range(12):
    a=i*.42
    sphere("ChainLink_%02d"%i,.035,(.34+.055*math.sin(a),1.52-i*.065,-.31),silver2)
for i in range(24):
    a=2*math.pi*i/24
    sphere("EnergyNode_%02d"%i,.030,(.44*math.cos(a),2.12+.28*math.sin(a),-.36),blue2)

scene.metadata.update({
    "asset":"NEXUS Hero",
    "reference":"user-supplied character reference direction",
    "units":"meters",
    "target_height_m":2.85,
    "detail_pass":"face_hair_proportions_coat_armor_gloves_pants_boots_sword_emissive",
    "production_stage":"reference-driven detailed binary GLB; skeletal animation clips pending"
})
out=os.environ.get("NEXUS_GLB_OUT","assets/characters/nexus-hero.glb")
os.makedirs(os.path.dirname(out),exist_ok=True)
scene.export(out,file_type="glb")
print(out,os.path.getsize(out),len(scene.geometry))
