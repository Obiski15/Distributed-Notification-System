export const template_routes = async (fastify: any) => {
  fastify.get("/", async (_request: any, reply: any) => {
    const [templates] = await fastify.mysql.query("SELECT * FROM templates");
    reply.code(200).send(templates);
  });

  fastify.post("/", async (request: any, reply: any) => {
    const { name, subject, body } = request.body;
    const [template] = await fastify.mysql.query(
      "INSERT INTO templates (name, subject, body) VALUES (?, ?, ?)",
      [name, subject, body]
    );

    reply.code(201).send({ id: template.insertId, name, subject, body });
  });

  fastify.get("/:template_code", async (request: any, reply: any) => {
    const { template_code } = request.params;
    const [[template]] = await fastify.mysql.query(
      "SELECT * FROM templates WHERE name = ?",
      [template_code]
    );

    reply.code(200).send(template);
  });

  fastify.put("/templates/:id", async (request: any, reply: any) => {
    const { id } = request.params;
    const { name, subject, body } = request.body;
    await fastify.mysql.query(
      "UPDATE templates SET name = ?, subject = ?, body = ? WHERE id = ?",
      [name, subject, body, id]
    );

    reply.code(200).send({ id, name, subject, body });
  });

  fastify.delete("/:id", async (request: any, reply: any) => {
    const { id } = request.params;
    await fastify.mysql.query("DELETE FROM templates WHERE id = ?", [id]);
    reply.code(204).send();
  });
};
