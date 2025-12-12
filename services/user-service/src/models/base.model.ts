import { UserDataSource } from "../config/datasource"
import { User as UserEntity } from "../entities/user-entity"

const userRepository = UserDataSource.getRepository(UserEntity)
export class BaseModel {
  find_by_id = async (id: string) => {
    const user = await userRepository.findOne({
      where: { id },
    })

    return user
  }

  find_by_email = async (email: string) => {
    const user = await userRepository.findOne({ where: { email } })
    return user
  }
}
