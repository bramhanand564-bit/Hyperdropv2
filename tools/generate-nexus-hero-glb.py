import trimesh, math, os
from trimesh.transformations import rotation_matrix

scene = trimesh.Scene()

def mat(name, color, metal=0.0, rough=.45, emit=None):
    kwargs = dict(name=name, baseColorFactor=(*color, 1.0), metallicFactor=metal, roughnessFactor=rough)
    if emit:
        kwargs.update(emissiveFactor=emit, emissiveStrength=3.0)
    return trimesh.visual.material.PBRMaterial(**kwargs)

black = mat('Tactical Black', (0.025,.035,.055), .72, .30)
white = mat('Coat White', (.78,.82,.86), .45, .34)
silver = mat('Armor Silver', (.42,.48,.56), .9, .22)
blue = mat('Electric Blue', (.02,.12,.32), .55, .25, (.02,.45,1.0))
skin = mat('Skin', (.63,.35,.23), 0.0, .5)
hair = mat('Black Hair', (.008,.012,.02), .55, .22)

def add(g, name, material, pos=(0,0,0), rot=None):
    g.visual.material = material
    g.metadata['name'] = name
    if rot is not None:
        g.apply_transform(rotation_matrix(rot[0], rot[1]))
    g.apply_translation(pos)
    scene.add_geometry(g, node_name=name, geom_name=name)

def box(name, size, pos, material, rot=None):
    return add(trimesh.creation.box(size), name, material, pos, rot)

def cyl(name, r, h, pos, material, sections=24):
    return add(trimesh.creation.cylinder(r, h, sections=sections), name, material, pos)

def sph(name, r, pos, material):
    return add(trimesh.creation.icosphere(subdivisions=3, radius=r), name, material, pos)

def cone(name, r1, r2, h, pos, material):
    return add(trimesh.creation.cone(r1, h, sections=20), name, material, pos)

for side, x in [('L',-.22),('R',.22)]:
    box('Boot_'+side, (.38,.22,.72), (x,.11,.05), black)
    box('BootGlow_'+side, (.40,.035,.70), (x,.035,.05), blue)
    box('BootArmor_'+side, (.40,.18,.22), (x,.24,.12), silver)
    for i in range(3):
        box(f'BootDetail_{side}_{i}', (.08,.08,.08), (x-.12+i*.12,.32,.12), blue)

for side, x in [('L',-.22),('R',.22)]:
    box('Shin_'+side, (.27,.62,.30), (x,.60,0), black)
    box('Knee_'+side, (.31,.20,.32), (x,.93,.02), silver)
    box('Thigh_'+side, (.34,.66,.36), (x,1.22,0), black)
    box('ThighArmor_'+side, (.37,.12,.38), (x,1.40,.05), silver)

box('Pelvis', (.72,.30,.40), (0,1.58,0), black)
box('BeltMain', (.82,.10,.44), (0,1.74,0), silver)
box('BeltBlue', (.84,.045,.45), (0,1.75,-.01), blue)
box('Buckle', (.18,.14,.08), (0,1.75,-.24), silver)
for x in [-.34,.34]:
    box('UtilityPouch', (.16,.25,.24), (x,1.60,-.04), black)
    box('PouchBlue', (.08,.05,.25), (x,1.61,-.17), blue)

box('Torso', (.78,.92,.42), (0,2.12,0), black)
box('ChestPanel', (.60,.48,.07), (0,2.25,-.235), white)
box('ChestCore', (.18,.24,.08), (0,2.20,-.285), blue)

for side, x in [('L',-.39),('R',.39)]:
    box('CoatFront_'+side, (.28,.88,.10), (x,2.05,-.22), white)
    box('CoatTail_'+side, (.30,1.18,.10), (x,1.60,.12), white)
    box('CoatBlue_'+side, (.055,.95,.035), (x,1.88,-.285), blue)

cyl('Neck', .15, .22, (0,2.62,0), skin)
sph('Head', .30, (0,2.94,0), skin)
sph('Jaw', .26, (0,2.82,-.01), skin)
sph('HairBase', .315, (0,3.10,.02), hair)
for i in range(24):
    a = 2*math.pi*i/24
    x, z = .30*math.cos(a), .30*math.sin(a)
    cone('HairSpike', .065, .008, .42, (x,3.20+(.05 if i%3==0 else 0),z), hair)
for i in range(7):
    cone('Bang', .06, .006, .34, ((i-3)*.075,3.03,-.25), hair)
for x in [-.105,.105]:
    sph('Eye', .045, (x,2.97,-.275), blue)
    box('Brow', (.11,.025,.035), (x,3.055,-.275), hair)

for side, x in [('L',-.54),('R',.54)]:
    sph('ShoulderArmor_'+side, .18, (x,2.48,0), silver)
    sph('ShoulderGlow_'+side, .075, (x,2.48,-.12), blue)
    cyl('UpperArm_'+side, .12, .48, (x,2.16,0), black)
    cyl('Forearm_'+side, .13, .45, (x,1.82,-.02), black)
    box('ForearmArmor_'+side, (.25,.28,.28), (x,1.85,-.03), silver)
    sph('Hand_'+side, .13, (x,1.55,-.03), skin)
    for j in range(5):
        box(f'GloveFinger_{side}_{j}', (.045,.16,.07), (x-.09+j*.045,1.48,-.10), black)
    box('GlovePlate_'+side, (.24,.16,.06), (x,1.58,-.16), blue)

for side, x in [('L',-.54),('R',.54)]:
    for j in range(3):
        cone(f'ShoulderFin_{side}_{j}', .09, .015, .28, (x+(-.06 if side=='L' else .06)*j,2.57,.02), silver)

box('Backpack', (.54,.72,.20), (0,2.20,.30), black)
box('BackEmblem', (.28,.28,.04), (0,2.25,.41), blue)
for x in [-.16,.16]:
    box('BackLight', (.05,.55,.035), (x,2.20,.42), blue)

box('SwordGrip', (.10,.55,.10), (.48,2.16,.38), blue)
box('SwordGuard', (.34,.08,.10), (.48,2.46,.38), silver)
box('SwordBlade', (.12,1.20,.06), (.48,3.02,.38), silver)
box('SwordEnergy', (.045,1.12,.035), (.48,3.02,.34), blue)

for x in [-.30,.30]:
    box('CoatStrap', (.07,1.05,.06), (x,2.15,-.28), silver)
for i in range(7):
    a = i*.42
    sph('ChainLink', .035, (.34+.04*math.sin(a),1.45-i*.06,-.27), silver)
for i in range(14):
    a = 2*math.pi*i/14
    sph('EnergyNode', .028, (.43*math.cos(a),2.0+.25*math.sin(a),-.27), blue)

scene.metadata.update({
    'asset':'NEXUS Hero',
    'reference':'user-supplied character reference',
    'units':'meters',
    'target_height_m':2.85,
    'production_stage':'reference-driven binary GLB; rig/animation clips pending'
})
out = os.environ.get('NEXUS_GLB_OUT', 'assets/characters/nexus-hero.glb')
os.makedirs(os.path.dirname(out), exist_ok=True)
scene.export(out, file_type='glb')
print(out, os.path.getsize(out), len(scene.geometry))
