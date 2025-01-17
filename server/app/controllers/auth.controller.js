const config = require("../config/auth.config");
const db = require("../models");
const Student = db.student;
const Faculty = db.faculty;
const Role = db.role;

var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");

exports.studentSignup = (req, res) => {
  const user = new Student({
    name: req.body.name,
    regno: req.body.regno,
    email: req.body.email,
    department: req.body.department,
    year: req.body.year,
    semester: req.body.semester,
    password: bcrypt.hashSync(req.body.password, 8),
  });
  // console.log(user);

  user.save((err, user) => {
    if (err) {
      res.status(500).send({ message: err });
      return;
    }

    if (req.body.roles) {
      Role.find(
        {
          name: { $in: req.body.roles },
        },
        (err, roles) => {
          if (err) {
            res.status(500).send({ message: err });
            return;
          }

          user.roles = roles.map((role) => role._id);
          user.save((err) => {
            if (err) {
              res.status(500).send({ message: err });
              return;
            }

            res.send({ message: "User was registered successfully!" });
          });
        }
      );
    } else {
      Role.findOne({ name: "student" }, (err, role) => {
        if (err) {
          res.status(500).send({ message: err });
          return;
        }

        user.roles = [role._id];
        user.save((err) => {
          if (err) {
            res.status(500).send({ message: err });
            return;
          }

          res.send({ message: "User was registered successfully!" });
        });
      });
    }
  });
};

exports.facultySignup = (req, res) => {
  const user = new Faculty({
    name: req.body.name,
    facultyid: req.body.facultyid,
    email: req.body.email,
    dateOfJoining: req.body.dateOfJoining,
    department: req.body.department,
    designation: req.body.designation,
    password: bcrypt.hashSync(req.body.password, 8),
  });
  console.log(user);

  user.save((err, user) => {
    if (err) {
      res.status(500).send({ message: err });
      return;
    }

    if (req.body.roles) {
      Role.find(
        {
          name: { $in: req.body.roles },
        },
        (err, roles) => {
          if (err) {
            res.status(500).send({ message: err });
            return;
          }

          user.roles = roles.map((role) => role._id);
          user.save((err) => {
            if (err) {
              res.status(500).send({ message: err });
              return;
            }

            res.send({ message: "User was registered successfully!" });
          });
        }
      );
    } else {
      Role.findOne({ name: "faculty" }, (err, role) => {
        if (err) {
          res.status(500).send({ message: err });
          return;
        }

        user.roles = [role._id];
        user.save((err) => {
          if (err) {
            res.status(500).send({ message: err });
            return;
          }

          res.send({ message: "Faculty was registered successfully!" });
        });
      });
    }
  });
};

exports.signin = (req, res) => {
  Student.findOne({
    email: req.body.email,
  }).populate("roles", "-__v").exec((err, student) => {
    if (err) {
      res.status(500).send({ message: err });
      return;
    }

    if (student) {
      var passwordIsValid = bcrypt.compareSync(
        req.body.password,
        student.password
      );

      if (!passwordIsValid) {
        return res.status(401).send({ message: "Invalid Password!" });
      }

      var token = jwt.sign({ id: student.id }, config.secret, {
        expiresIn: 86400, // 24 hours
      });

      var authorities = [];
      for (let i = 0; i < student.roles.length; i++) {
        authorities.push("ROLE_" + student.roles[i].name.toUpperCase());
      }

      req.session.token = token;

      return res.status(200).send({
        id: student._id,
        name: student.name,
        regno: student.regno,
        email: student.email,
        department: student.department,
        year: student.year,
        semester: student.semester,
        roles: authorities,
      });
    } else {
      Faculty.findOne({
        email: req.body.email,
      }).populate("roles", "-__v").exec((err, faculty) => {
        if (err) {
          res.status(500).send({ message: err });
          return;
        }

        if (faculty) {
          var passwordIsValid = bcrypt.compareSync(
            req.body.password,
            faculty.password
          );

          if (!passwordIsValid) {
            return res.status(401).send({ message: "Invalid Password!" });
          }

          var token = jwt.sign({ id: faculty.id }, config.secret, {
            expiresIn: 86400, // 24 hours
          });

          var authorities = [];
          for (let i = 0; i < faculty.roles.length; i++) {
            authorities.push("ROLE_" + faculty.roles[i].name.toUpperCase());
          }

          req.session.token = token;

          return res.status(200).send({
            id: faculty._id,
            name: faculty.name,
            facultyid: faculty.facultyid,
            email: faculty.email,
            department: faculty.department,
            dateOfJoining: faculty.dateOfJoining,
            designation: faculty.designation,
            roles: authorities,
          });
        } else {
          return res.status(404).send({ message: "User Not found." });
        }
      });
    }
  });
};

exports.signout = async (req, res) => {
  try {
    req.session = null;
    return res.status(200).send({ message: "You've been signed out!" });
  } catch (err) {
    this.next(err);
  }
};
