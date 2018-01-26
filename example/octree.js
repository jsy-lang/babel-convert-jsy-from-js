var Octree, octreeTest;

Octree = class Octree {
  constructor(opts) {
    this.stats = this.stats.bind(this);
    this.updateAabb = this.updateAabb.bind(this);
    this.isRoot = this.isRoot.bind(this);
    this.isEmpty = this.isEmpty.bind(this);
    this.isFull = this.isFull.bind(this);
    this.isLeaf = this.isLeaf.bind(this);
    this.isBranchEmpty = this.isBranchEmpty.bind(this);
    this.root = this.root.bind(this);
    this.getOctantByVec = this.getOctantByVec.bind(this);
    this.getOctantByAabb = this.getOctantByAabb.bind(this);
    this.insert = this.insert.bind(this);
    this._insert = this._insert.bind(this);
    this._insertHere = this._insertHere.bind(this);
    this.remove = this.remove.bind(this);
    this.subdivide = this.subdivide.bind(this);
    this.reload = this.reload.bind(this);
    //@root().trim()
    this.bubble = this.bubble.bind(this);
    this.sink = this.sink.bind(this);
    this.trim = this.trim.bind(this);
    this.aabbIntersects = this.aabbIntersects.bind(this);
    this.intersectAabbVec = this.intersectAabbVec.bind(this);
    this.intersectSphereVec = this.intersectSphereVec.bind(this);
    this.intersectAabbAabb = this.intersectAabbAabb.bind(this);
    this.containsAabbAabb = this.containsAabbAabb.bind(this);
    this.intersectSphereSphere = this.intersectSphereSphere.bind(this);
    this.intersectAabbSphere = this.intersectAabbSphere.bind(this);
    this.frustumToObb = this.frustumToObb.bind(this);
    // ?
    // if = mat4.invert mat4.create(), frustum
    // obb = mat4.mul mat4.create(), frustum, if
    // ?
    this.intersectAabbFrustum = this.intersectAabbFrustum.bind(this);
    this.mapAll = this.mapAll.bind(this);
    this.collectAll = this.collectAll.bind(this);
    this.collectAllPreSorted = this.collectAllPreSorted.bind(this);
    this.collectAllPostSorted = this.collectAllPostSorted.bind(this);
    this.streamAll = this.streamAll.bind(this);
    this.removeAllStream = this.removeAllStream.bind(this);
    this.random = this.random.bind(this);
    this.ifIntersectsAabb = this.ifIntersectsAabb.bind(this);
    this.ifIntersectsSphere = this.ifIntersectsSphere.bind(this);
    this.queryByAabb = this.queryByAabb.bind(this);
    this.queryBySphere = this.queryBySphere.bind(this);
    this.streamBySphere = this.streamBySphere.bind(this);
    this.extend(this, {
      parent: null,
      o: [0.0, 0.0, 0.0],
      size: 1,
      threshold: 10,
      octantIdx: 0,
      depth: 0
    }, opts);
    this._threshold = this.threshold;
    this.hSize = this.size / 2;
    this.octants = [];
    this.nodes = [];
    this.nodesLen = 0;
    this.branchesLen = 0;
    this.updateAabb();
    this.depth = this.isRoot() ? 0 : this.parent.depth + 1;
  }

  extend() { // obj, defaults, config
    var i, j, key, ref;
    for (i = j = 1, ref = arguments.length; 1 <= ref ? j < ref : j > ref; i = 1 <= ref ? ++j : --j) {
      for (key in arguments[i]) {
        if (arguments[i].hasOwnProperty(key)) {
          arguments[0][key] = arguments[i][key];
        }
      }
    }
    return arguments[0];
  }

  stats() {
    var stats;
    stats = {
      total_depth: 0
    };
    this.sink((branch) => {
      var idx, j, len, path, selector;
      path = [];
      branch.bubble((branch) => {
        return path.push(branch.octantIdx);
      });
      path.reverse();
      selector = stats;
      for (j = 0, len = path.length; j < len; j++) {
        idx = path[j];
        if (selector[idx] == null) {
          selector[idx] = {};
        }
        selector = selector[idx];
      }
      selector.path_to_here = path.join('.');
      if (branch.depth > stats.total_depth) {
        stats.total_depth = branch.depth;
      }
      selector.branch_depth = branch.depth;
      selector.bloat_here = branch._threshold - branch.threshold;
      selector.len_nodes_here = branch.nodes.length;
      selector.len_nodes_branch = branch.nodesLen;
      return selector.len_branches = branch.branchesLen;
    });
    return stats;
  }

  updateAabb() {
    return this.aabb = [[this.o[0] - this.hSize, this.o[1] - this.hSize, this.o[2] - this.hSize], [this.o[0] + this.hSize, this.o[1] + this.hSize, this.o[2] + this.hSize]];
  }

  isRoot() {
    return this.parent == null;
  }

  isEmpty() {
    return this.nodes.length === 0;
  }

  isFull() {
    return this.nodes.length >= this._threshold;
  }

  isLeaf() {
    return this.octants.length === 0;
  }

  isBranchEmpty() {
    var flag;
    flag = true;
    this.sink((tree) => {
      if (!tree.isEmpty()) {
        return flag = false;
      }
    });
    return flag;
  }

  root() {
    var root;
    root = this;
    this.bubble((tree) => {
      return root = tree;
    });
    return root;
  }

  getOctantByVec(vec) {
    var idx;
    idx = 0;
    if (vec[0] >= this.o[0]) {
      idx += 4;
    }
    if (vec[1] >= this.o[1]) {
      idx += 2;
    }
    if (vec[2] >= this.o[2]) {
      idx += 1;
    }
    return this.octants[idx];
  }

  getOctantByAabb(aabb) {
    if (this.containsAabbAabb(this.octants[0].aabb, aabb)) {
      return 0;
    }
    if (this.containsAabbAabb(this.octants[1].aabb, aabb)) {
      return 1;
    }
    if (this.containsAabbAabb(this.octants[2].aabb, aabb)) {
      return 2;
    }
    if (this.containsAabbAabb(this.octants[3].aabb, aabb)) {
      return 3;
    }
    if (this.containsAabbAabb(this.octants[4].aabb, aabb)) {
      return 4;
    }
    if (this.containsAabbAabb(this.octants[5].aabb, aabb)) {
      return 5;
    }
    if (this.containsAabbAabb(this.octants[6].aabb, aabb)) {
      return 6;
    }
    if (this.containsAabbAabb(this.octants[7].aabb, aabb)) {
      return 7;
    }
    return -1; // overlapping / split over multiple octants
  }

  insert(node) {
    var accessor, isBounding, isContained, nodeToInsert;
    if ((node.location != null) || (node.position != null) || (node.centroid != null)) {
      if (node.location != null) {
        accessor = 'location';
      }
      if (node.position != null) {
        accessor = 'position';
      }
      if (node.centroid != null) {
        accessor = 'centroid';
      }
      isBounding = false;
    }
    if ((node.bounds != null) || (node.boundingBox != null) || (node.aabb != null)) {
      if (node.bounds != null) {
        accessor = 'bounds';
      }
      if (node.boundingBox != null) {
        accessor = 'boundingBox';
      }
      if (node.aabb != null) {
        accessor = 'aabb';
      }
      isBounding = true;
    }
    if (accessor == null) {
      console.log('[ octree.js ] Unable to insert node: no detectable positional or bounding information.', node);
    } else {
      nodeToInsert = {
        data: node,
        accessor: accessor,
        isBounding: isBounding,
        geometry: (function() {
          return this.data[accessor];
        })
      };
      if (nodeToInsert.isBounding) {
        isContained = this.containsAabbAabb(this.aabb, nodeToInsert.geometry());
      } else {
        isContained = this.intersectAabbVec(this.aabb, nodeToInsert.geometry());
      }
      if (isContained) {
        this._insert(nodeToInsert);
      } else {
        console.log('[ octree.js ] Node out of bounds or not completely within octree bounds:', this, node);
      }
    }
    return node;
  }

  _insert(node) {
    var idx;
    if (this.isLeaf()) {
      return this._insertHere(node);
    } else {
      if (node.isBounding) {
        idx = this.getOctantByAabb(node.geometry());
        if (idx < 0) { // overlaps octants
          if (this.isFull()) {
            this._threshold++;
          }
          return this._insertHere(node);
        } else {
          return this.octants[idx]._insert(node);
        }
      } else {
        return this.getOctantByVec(node.geometry())._insert(node);
      }
    }
  }

  _insertHere(node) {
    if (this.isFull()) {
      this.subdivide();
      return this._insert(node);
    } else {
      //@reload()
      this.bubble((branch) => {
        return branch.nodesLen++;
      });
      node.parent = this;
      this.nodes.push(node);
      if (node.onInsert != null) {
        if (!node.hasBeenInserted) {
          node.hasBeenInserted = true;
          return node.data.onInsert(this);
        } else if (node.onUpdate != null) {
          return node.data.onUpdate(this);
        }
      }
    }
  }

  remove(node) {
    if (node == null) {
      return false;
    }
    if ((node.parent != null) && node.parent instanceof Octree) {
      node.parent.nodes.splice(node.parent.nodes.indexOf(node), 1);
      node.parent.reload();
      return node.data;
    } else {
      this.sink((tree) => {
        var checkNode, j, len, ref, removed;
        removed = false;
        ref = tree.nodes;
        for (j = 0, len = ref.length; j < len; j++) {
          checkNode = ref[j];
          if (checkNode.data === node) {
            tree.nodes.splice(tree.nodes.indexOf(checkNode), 1);
            tree.reload();
            removed = true;
            break;
          }
        }
        if (removed) {
          return node;
        }
      });
    }
    return false;
  }

  subdivide() {
    /* in relation to root
    child    0 1 2 3 4 5 6 7
        x    - - - - + + + +
        y    - - + + - - + +
        z    - + - + - + - +
    */
    var n, p;
    this.bubble((branch) => {
      return branch.branchesLen += 8;
    });
    p = [this.o[0] + this.hSize / 2, this.o[1] + this.hSize / 2, this.o[2] + this.hSize / 2];
    n = [this.o[0] - this.hSize / 2, this.o[1] - this.hSize / 2, this.o[2] - this.hSize / 2];
    this.octants[0] = new Octree({
      parent: this,
      o: [n[0], n[1], n[2]],
      size: this.hSize,
      threshold: this.threshold,
      octantIdx: 0
    });
    this.octants[1] = new Octree({
      parent: this,
      o: [n[0], n[1], p[2]],
      size: this.hSize,
      threshold: this.threshold,
      octantIdx: 1
    });
    this.octants[2] = new Octree({
      parent: this,
      o: [n[0], p[1], n[2]],
      size: this.hSize,
      threshold: this.threshold,
      octantIdx: 2
    });
    this.octants[3] = new Octree({
      parent: this,
      o: [n[0], p[1], p[2]],
      size: this.hSize,
      threshold: this.threshold,
      octantIdx: 3
    });
    this.octants[4] = new Octree({
      parent: this,
      o: [p[0], n[1], n[2]],
      size: this.hSize,
      threshold: this.threshold,
      octantIdx: 4
    });
    this.octants[5] = new Octree({
      parent: this,
      o: [p[0], n[1], p[2]],
      size: this.hSize,
      threshold: this.threshold,
      octantIdx: 5
    });
    this.octants[6] = new Octree({
      parent: this,
      o: [p[0], p[1], n[2]],
      size: this.hSize,
      threshold: this.threshold,
      octantIdx: 6
    });
    return this.octants[7] = new Octree({
      parent: this,
      o: [p[0], p[1], p[2]],
      size: this.hSize,
      threshold: this.threshold,
      octantIdx: 7
    });
  }

  reload() {
    var reinsertNode;
    reinsertNode = (node) => {
      if (node != null) {
        this.bubble((branch) => {
          return branch.nodesLen--;
        });
        if (this._threshold > this.threshold) {
          this._threshold--;
        }
        this._insert(node);
        return reinsertNode(this.nodes.pop());
      }
    };
    return reinsertNode(this.nodes.pop());
  }

  bubble(fn) {
    fn(this);
    if (!this.isRoot()) {
      return this.parent.bubble(fn);
    }
  }

  sink(fn) {
    var j, len, ref, results, tree;
    fn(this);
    ref = this.octants;
    results = [];
    for (j = 0, len = ref.length; j < len; j++) {
      tree = ref[j];
      results.push(tree.sink(fn));
    }
    return results;
  }

  trim() {
    return this.sink((tree) => {
      if (tree.isBranchEmpty()) {
        tree.octants = [];
        return this.bubble((branch) => {
          return branch.branchesLen -= tree.branchesLen;
        });
      }
    });
  }

  aabbIntersects(aabb1, aabb2) {
    var axis, bases, dot, flag, j, k, len, o1, o2, t, tCalcs, tmax, tmin;
    dot = function(a, b) {
      return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    };
    bases = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
    for (axis = j = 0; j < 3; axis = ++j) {
      flag = true;
      tCalcs = [dot([aabb2[0][0], aabb2[0][1], aabb2[0][2]], bases[axis]), dot([aabb2[1][0], aabb2[0][1], aabb2[0][2]], bases[axis]), dot([aabb2[0][0], aabb2[1][1], aabb2[0][2]], bases[axis]), dot([aabb2[1][0], aabb2[1][1], aabb2[0][2]], bases[axis]), dot([aabb2[0][0], aabb2[0][1], aabb2[1][2]], bases[axis]), dot([aabb2[1][0], aabb2[0][1], aabb2[1][2]], bases[axis]), dot([aabb2[0][0], aabb2[1][1], aabb2[1][2]], bases[axis]), dot([aabb2[1][0], aabb2[1][1], aabb2[1][2]], bases[axis])];
      for (k = 0, len = tCalcs.length; k < len; k++) {
        t = tCalcs[k];
        if (typeof tmin === "undefined" || tmin === null) {
          tmin = t;
        }
        if (typeof tmax === "undefined" || tmax === null) {
          tmax = t;
        }
        if (t < tmin) {
          tmin = t;
        }
        if (t > tmax) {
          tmax = t;
        }
      }
      o1 = dot(aabb1[0], bases[axis]);
      o2 = dot(aabb1[1], bases[axis]);
      if (tmin > o2 || tmax < o1) {
        flag = false;
        break;
      }
    }
    return flag;
  }

  intersectAabbVec(aabb, vec) {
    return vec[0] <= aabb[1][0] && vec[1] <= aabb[1][1] && vec[2] <= aabb[1][2] && vec[0] >= aabb[0][0] && vec[1] >= aabb[0][1] && vec[2] >= aabb[0][2];
  }

  intersectSphereVec(s, vec) {
    var diff, mag, rad;
    diff = [s[0] - vec[0], s[1] - vec[1], s[2] - vec[2]];
    mag = diff[0] * diff[0] + diff[1] * diff[1] + diff[2] * diff[2];
    rad = s[3] * s[3];
    return mag <= rad;
  }

  intersectAabbAabb(aabb1, aabb2) {
    if (this.intersectAabbVec(aabb1, aabb2[0]) || this.intersectAabbVec(aabb1, aabb2[1])) {
      return true;
    }
    return this.aabbIntersects(aabb1, aabb2) || this.aabbIntersects(aabb2, aabb1);
  }

  containsAabbAabb(aabb, tAabb) {
    return (aabb[0][0] <= tAabb[0][0]) && (aabb[1][0] >= tAabb[1][0]) && (aabb[0][1] <= tAabb[0][1]) && (aabb[1][1] >= tAabb[1][1]) && (aabb[0][2] <= tAabb[0][2]) && (aabb[1][2] >= tAabb[1][2]);
  }

  intersectSphereSphere(s1, s2) {
    var diff, mag, rad;
    diff = [s2[0] - s1[0], s2[1] - s1[1], s2[2] - s1[2]];
    mag = diff[0] * diff[0] + diff[1] * diff[1] + diff[2] * diff[2];
    rad = s2[3] + s1[3];
    return mag <= rad * rad;
  }

  intersectAabbSphere(aabb, sphere) {
    var dmin, i, j;
    // Arvo's algorithm "solid box - solid sphere"
    // http://tog.acm.org/resources/GraphicsGems/gems/BoxSphere.c
    dmin = 0;
    // three dimensions
    for (i = j = 0; j < 3; i = ++j) {
      if (sphere[i] < aabb[0][i]) {
        dmin += Math.pow(sphere[i] - aabb[0][i], 2);
      }
      if (sphere[i] > aabb[1][i]) {
        dmin += Math.pow(sphere[i] - aabb[1][i], 2);
      }
    }
    return dmin <= Math.pow(sphere[3], 2);
  }

  frustumToObb(frustum) {}

  intersectAabbFrustum(aabb, frustum) {
    var dot, flag, j, len, mag, plane, planeD, vmax, vmin;
    // this should check a bounding box of the frustum first, then if there's an intersection
    // check with this algorithm
    dot = function(a, b) {
      return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    };
    mag = function(vec) {
      return Math.sqrt(vec[0] * vec[0] + vec[1] * vec[1] + vec[2] * vec[2]);
    };
    vmax = [0, 0, 0];
    vmin = [0, 0, 0];
    flag = false;
    for (j = 0, len = frustum.length; j < len; j++) {
      plane = frustum[j];
      // x
      if (plane[1][0] > 0) {
        vmin[0] = aabb[0][0];
        vmax[0] = aabb[1][0];
      } else {
        vmin[0] = aabb[1][0];
        vmax[0] = aabb[0][0];
      }
      // y
      if (plane[1][1] > 0) {
        vmin[1] = aabb[0][1];
        vmax[1] = aabb[1][1];
      } else {
        vmin[1] = aabb[1][1];
        vmax[1] = aabb[0][1];
      }
      // z
      if (plane[1][2] > 0) {
        vmin[2] = aabb[0][2];
        vmax[2] = aabb[1][2];
      } else {
        vmin[2] = aabb[1][2];
        vmax[2] = aabb[0][2];
      }
      planeD = mag(plane[0]);
      // if dot( plane[1], vmin ) + planeD > 0 # aabb is outside of plane definition
      if (dot(plane[1], vmax) + planeD >= 0) { // intersection
        flag = true;
        break;
      }
    }
    return flag; // if code doesn't break from intersection, then the aabb is completely within the frustum
  }

  mapAll(fn) {
    var allNodes;
    allNodes = [];
    this.sink((tree) => {
      var j, len, node, ref, results;
      ref = tree.nodes;
      results = [];
      for (j = 0, len = ref.length; j < len; j++) {
        node = ref[j];
        results.push(allNodes.push(fn(node.data)));
      }
      return results;
    });
    return allNodes;
  }

  collectAll(property) {
    var allNodes;
    allNodes = [];
    if (property != null) {
      this.sink((tree) => {
        var j, len, node, ref, results;
        ref = tree.nodes;
        results = [];
        for (j = 0, len = ref.length; j < len; j++) {
          node = ref[j];
          results.push(allNodes.push(node.data[property]));
        }
        return results;
      });
    } else {
      this.sink((tree) => {
        var j, len, node, ref, results;
        ref = tree.nodes;
        results = [];
        for (j = 0, len = ref.length; j < len; j++) {
          node = ref[j];
          results.push(allNodes.push(node.data));
        }
        return results;
      });
    }
    return allNodes;
  }

  collectAllPreSorted(sortFn, property) {
    var idx, nodes, tmpArr;
    nodes = this.collectAll().sort(sortFn);
    if (property != null) {
      tmpArr = [];
      idx = 0;
      while (idx <= nodes.length - 1) {
        tmpArr.push(nodes[idx][property]);
        idx++;
      }
      return tmpArr;
    } else {
      return nodes;
    }
  }

  collectAllPostSorted(sortFn, property) {
    return this.collectAll(property).sort(sortFn);
  }

  streamAll(callback, property) {
    if (property != null) {
      if (property === '__raw') {
        this.sink((tree) => {
          var j, len, node, ref, results;
          ref = tree.nodes;
          results = [];
          for (j = 0, len = ref.length; j < len; j++) {
            node = ref[j];
            results.push(callback(node));
          }
          return results;
        });
      } else {
        this.sink((tree) => {
          var j, len, node, ref, results;
          ref = tree.nodes;
          results = [];
          for (j = 0, len = ref.length; j < len; j++) {
            node = ref[j];
            results.push(callback(node.data[property]));
          }
          return results;
        });
      }
    } else {
      this.sink((tree) => {
        var j, len, node, ref, results;
        ref = tree.nodes;
        results = [];
        for (j = 0, len = ref.length; j < len; j++) {
          node = ref[j];
          results.push(callback(node.data));
        }
        return results;
      });
    }
    return void 0;
  }

  removeAllStream(callback) {
    var popfn;
    popfn = (tree, fn) => {
      var node;
      node = tree.nodes.pop();
      if (node != null) {
        fn(node.data);
        this.bubble((branch) => {
          return branch.nodesLen -= 1;
        });
        return popfn(tree, fn);
      }
    };
    this.sink((tree) => {
      return popfn(tree, callback);
    });
    this.trim();
    return void 0;
  }

  random() {
    var allNodes;
    allNodes = this.collectAll();
    return allNodes[Math.floor(Math.random() * allNodes.length)];
  }

  ifIntersectsAabb(aabb, callback) {
    var j, k, len, len1, node, ref, ref1, results, tree;
    if (this.intersectAabbAabb(this.aabb, aabb)) {
      ref = this.nodes;
      for (j = 0, len = ref.length; j < len; j++) {
        node = ref[j];
        if (node.isBounding) {
          if (this.insertectAabbAabb(aabb, node.geometry())) {
            callback(node.data);
          }
        } else {
          if (this.intersectAabbVec(aabb, node.geometry())) {
            callback(node.data);
          }
        }
      }
      ref1 = this.octants;
      results = [];
      for (k = 0, len1 = ref1.length; k < len1; k++) {
        tree = ref1[k];
        results.push(tree.ifIntersectsAabb(aabb, callback));
      }
      return results;
    }
  }

  ifIntersectsSphere(s, callback) {
    var j, k, len, len1, node, ref, ref1, results, tree;
    if (this.intersectAabbSphere(this.aabb, s)) {
      ref = this.nodes;
      for (j = 0, len = ref.length; j < len; j++) {
        node = ref[j];
        if (node.isBounding) {
          if (this.intersectAabbSphere(node.geometry(), s)) {
            callback(node.data);
          }
        } else {
          if (this.intersectSphereVec(s, node.geometry())) {
            callback(node.data);
          }
        }
      }
      ref1 = this.octants;
      results = [];
      for (k = 0, len1 = ref1.length; k < len1; k++) {
        tree = ref1[k];
        results.push(tree.ifIntersectsSphere(s, callback));
      }
      return results;
    }
  }

  queryByAabb(aabb) {
    var matchedNodes;
    matchedNodes = [];
    this.ifIntersectsAabb(aabb, (node) => {
      return matchedNodes.push(node);
    });
    return matchedNodes;
  }

  queryBySphere(s) {
    var matchedNodes;
    matchedNodes = [];
    this.ifIntersectsSphere(s, (node) => {
      return matchedNodes.push(node);
    });
    return matchedNodes;
  }

  streamBySphere(s, callback) {
    this.ifIntersectsSphere(s, (node) => {
      return callback(node);
    });
    return void 0;
  }

};

/*
USER FUNCTIONS AND ARGUMENT SIGNATURES
*/
// === MANAGEMENT === These 
//   constructor -> Object options
//       Defaults: {
//           parent: null
//           o: [ 0.0, 0.0, 0.0 ]
//           size: 1
//           threshold: 10
//           octantIdx: 0
//           depth: 0
//       }
//       Returns: Octree octree

//   insert -> Object node
//       Insert will attempt to read location data from the node,
//           preferring bounding information to vector information
//           with the following priorities (least to greatest):
//           - location
//           | position
//           | centroid
//           | bounds
//           | boundingBox
//           V aabb
//       The Octree will deal with bounds vs. vector information accordingly
//           and is able to handle both simultaneously and for all queries.
//       Returns: Object node

//   root ->
//       #root() will return the root octree from and branch
//       Returns: Octree root

//   stats ->
//       #stats() is useful for debugging. It will return a tree, where each branch is the corresponding branch
//           in the octree identified by its octant index. The root has `total_depth`, and each branch has the
//           following information:
//                   bloat_here    The amount of nodes that would overlap if pushed lower down the graph. Overlapping cases violate the threshold constraint
//                 branch_depth    Depth at this branch
//                 len_branches    Total amount of branches contained in and under this branch to total depth of graph
//             len_nodes_branch    Total amount of nodes contained in and under this branch to total depth of graph
//               len_nodes_here    Nodes contained in this branch (should be less than or equal to threshold, unless there is bloating, then it should equal the bloat plus threshold)
//                 path_to_here    Path is a period delimited string of octant indices to and including this branch (ie. "0" is the root, and "0.1" is octant at index one of the root)
//       Returns: Object object

// === ITERATORS === These operate on the structure of the octree
//   bubble -> Function( Function fn )
//       Executes `fn` on receiving octree, then up parent structure
//         until execution stops at the root.
//       Returns: undefined

//   sink -> Function( Function fn )
//       Executes `fn` on the receiving octree, then to all children recursively
//         through the total depth of the graph
//       Returns: undefined

// === QUERIES === These return nodes
//   mapAll -> Function( Object node )
//       Returns: Array[ Returned objects from callback ]

//   collectAll -> { String property }
//       Returns: Array[ All nodes, unless property is specified, then all data from nodes at that accessor ]

//   collectAllPreSorted -> Function sortFn {, String property }
//       Sort function acts on nodes
//       Returns: Array[ See notes in #collectAll(), but sorted by #Array.sort( sortFn ) ]

//   collectAllPostSorted -> Function sortFn {, String property }
//       Sort function acts on whatever is returned from #collectAll() with the property paramater
//       Returns: Array[ See notes in #collectAll(), but sorted by #Array.sort( sortFn ) ]

//   streamAll -> Function( Object node ){, String property }
//       Callback is called per node, unless property is specified,
//         then callback is called per node with the data at that accessor
//       Returns: undefined

//   removeAllStream -> Function( Object node )
//       Callback is called per node at the same time that node is removed
//           from the octree
//       Returns: undefined

//   random ->
//       Returns: Object node

//   queryByAabb ->  3x2  Array [ x  x ]
//                              | y  y |
//                              [ z  z ]
//       Returns: Array[ Nodes intersecting sphere ]

//   queryBySphere ->  1x4  Array [ x  y  z  r ]
//       Returns: Array[ Nodes intersecting axis-aligned bounding box ]

//   streamBySphere -> 1x4 Array [ x y z r ], Function( Object node ) callback
//       Callback is called per node intersecting sphere
//       Returns: undefined
octreeTest = {
  test: function() {
    var j, len, testNodes, tn, window;
    if (typeof window === "undefined" || window === null) {
      window = {};
    }
    window.o = new Octree({
      o: [0, 0, 0],
      size: 2,
      threshold: 1
    });
    testNodes = [
      {
        name: 'center node in octant 0',
        aabb: [[-0.55,
      -0.55,
      -0.55],
      [-0.45,
      -0.45,
      -0.45]]
      },
      {
        name: 'center node in octant 1',
        aabb: [[-0.55,
      -0.55,
      0.45],
      [-0.45,
      -0.45,
      0.55]]
      },
      {
        name: 'center node in octant 2',
        aabb: [[-0.55,
      0.45,
      -0.55],
      [-0.45,
      0.55,
      -0.45]]
      },
      {
        name: 'center node in octant 3',
        aabb: [[-0.55,
      0.45,
      0.45],
      [-0.45,
      0.55,
      0.55]]
      },
      {
        name: 'center node in octant 3.0/1',
        aabb: [[-0.8,
      0.2,
      0.45],
      [-0.7,
      0.3,
      0.55]]
      },
      {
        name: 'center node in octant 3.0',
        aabb: [[-0.8,
      0.2,
      0.2],
      [-0.7,
      0.3,
      0.3]]
      },
      {
        name: 'center node in octant 3.1',
        aabb: [[-0.8,
      0.2,
      0.7],
      [-0.7,
      0.3,
      0.8]]
      },
      {
        name: 'center node in octant 3.2',
        aabb: [[-0.8,
      0.7,
      0.2],
      [-0.7,
      0.8,
      0.3]]
      },
      {
        name: 'center node in octant 3.3',
        aabb: [[-0.8,
      0.7,
      0.7],
      [-0.7,
      0.8,
      0.8]]
      },
      {
        name: 'center node in octant 3.4',
        aabb: [[-0.3,
      0.2,
      0.2],
      [-0.2,
      0.3,
      0.3]]
      },
      {
        name: 'center node in octant 3.5',
        aabb: [[-0.3,
      0.2,
      0.7],
      [-0.2,
      0.3,
      0.8]]
      },
      {
        name: 'center node in octant 3.6',
        aabb: [[-0.3,
      0.7,
      0.2],
      [-0.2,
      0.8,
      0.3]]
      },
      {
        name: 'center node in octant 3.7',
        aabb: [[-0.3,
      0.7,
      0.7],
      [-0.2,
      0.8,
      0.8]]
      },
      {
        name: 'center node in octant 4',
        aabb: [[0.45,
      -0.55,
      -0.55],
      [0.55,
      -0.45,
      -0.45]]
      },
      {
        name: 'center node in octant 5',
        aabb: [[0.45,
      -0.55,
      0.45],
      [0.55,
      -0.45,
      0.55]]
      },
      {
        name: 'center node in octant 6',
        aabb: [[0.45,
      0.45,
      -0.55],
      [0.55,
      0.55,
      -0.45]]
      },
      {
        name: 'center node in octant 7',
        aabb: [[0.45,
      0.45,
      0.45],
      [0.55,
      0.55,
      0.55]]
      }
    ];
    for (j = 0, len = testNodes.length; j < len; j++) {
      tn = testNodes[j];
      window.o.insert(tn);
    }
    return window.o;
  },
  prepareBuffers: function(o) {
    var octants, totalDepth;
    totalDepth = o.stats().total_depth;
    octants = [];
    o.sink((branch) => {
      var aabb, back_bottom_left, back_bottom_right, back_top_left, back_top_right, front_bottom_left, front_bottom_right, front_top_left, front_top_right;
      aabb = branch.aabb;
      back_bottom_left = aabb[0];
      back_bottom_right = [aabb[1][0], aabb[0][1], aabb[0][2]];
      back_top_left = [aabb[0][0], aabb[1][1], aabb[0][2]];
      back_top_right = [aabb[1][0], aabb[1][1], aabb[0][2]];
      front_bottom_left = [aabb[0][0], aabb[0][1], aabb[1][2]];
      front_bottom_right = [aabb[1][0], aabb[0][1], aabb[1][2]];
      front_top_left = [aabb[0][0], aabb[1][1], aabb[1][2]];
      front_top_right = aabb[1];
      return octants.push({
        opacity: ((totalDepth - branch.depth) + 1) / (totalDepth + 1),
        vertices: [
          // front
          front_bottom_left,
          front_bottom_right,
          front_bottom_right,
          front_top_right,
          front_top_right,
          front_top_left,
          front_top_left,
          front_bottom_left,
          // back
          back_bottom_left,
          back_bottom_right,
          back_bottom_right,
          back_top_right,
          back_top_right,
          back_top_left,
          back_top_left,
          back_bottom_left,
          // top
          back_top_left,
          back_top_right,
          back_top_right,
          front_top_right,
          front_top_right,
          front_top_left,
          front_top_left,
          back_top_left,
          // bottom
          back_bottom_left,
          back_bottom_right,
          back_bottom_right,
          front_bottom_right,
          front_bottom_right,
          front_bottom_left,
          front_bottom_left,
          back_bottom_left,
          // right
          back_bottom_right,
          back_top_right,
          back_top_right,
          front_top_right,
          front_top_right,
          front_bottom_right,
          front_bottom_right,
          back_bottom_right,
          // left
          back_bottom_left,
          back_top_left,
          back_top_left,
          front_top_left,
          front_top_left,
          front_bottom_left,
          front_bottom_left,
          back_bottom_left
        ]
      });
    });
    return {
      octants: octants,
      nodes: o.collectAll('aabb')
    };
  }
};

exports.Octree = Octree;

exports.octreeTest = octreeTest;

